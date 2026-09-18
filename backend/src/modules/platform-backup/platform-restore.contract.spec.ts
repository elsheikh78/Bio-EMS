import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("DEP-BR controlled restore helper contract", () => {
  it("requires a safety snapshot, controlled service quiesce, health verification and rollback", async () => {
    const source = await readFile(
      join(process.cwd(), "../installer/windows/Invoke-PlatformRestore.ps1"),
      "utf8"
    );
    expect(source).toContain("Stop-ControlledServices");
    expect(source).toContain("Test-PostInstallHealth.ps1");
    expect(source).toContain("Platform restore failed; safety snapshot was restored");
    expect(source).toContain("InfluxDB snapshot restore failed");
    expect(source).toContain("& $InfluxCli backup $safetyInflux");
    expect(source).toContain("WAL-consistent SQLite safety backup is missing");
    expect(source).not.toContain("Invoke-Robocopy $liveInflux");
    expect(source).toContain("trap {");
    expect(source).toContain('Set-RestoreJobState "FAILED" $fatalFailure.Exception.Message');
    expect(source.indexOf("trap {")).toBeLessThan(source.indexOf('Set-RestoreJobState "RUNNING"'));
  });

  it("revalidates sealed artifacts inside the worker before quiescing services", async () => {
    const source = await readFile(
      join(process.cwd(), "../installer/windows/Invoke-PlatformRestore.ps1"),
      "utf8"
    );
    const validationIndex = source.indexOf(
      "Revalidate the sealed payload inside the external worker"
    );
    const stopIndex = source.indexOf("Stop-ControlledServices", validationIndex);
    expect(validationIndex).toBeGreaterThan(-1);
    expect(stopIndex).toBeGreaterThan(validationIndex);
    expect(source).toContain("Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256");
    expect(source).toContain("artifact checksum mismatch in restore worker");
    expect(source).toContain("artifact size mismatch in restore worker");
    expect(source).toContain("artifact reparse points are not allowed in restore worker");
  });

  it("queues a detached worker before the backend service is quiesced", async () => {
    const serviceSource = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    const controllerSource = await readFile(
      join(process.cwd(), "src/controllers/platform-backup.controller.ts"),
      "utf8"
    );
    expect(serviceSource).toContain("restore-safety-");
    expect(serviceSource).toContain("detached: true");
    expect(serviceSource).toContain("child.unref()");
    expect(serviceSource).toContain('await sqlite.backup(join(safetyDirectory, "bioems.sqlite"))');
    expect(controllerSource).toContain("res.status(202)");
    expect(controllerSource).toContain("restoreQueued: true");
  });

  it("binds persisted restore jobs to installation identity and uses strict UUID validation", async () => {
    const serviceSource = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    const controllerSource = await readFile(
      join(process.cwd(), "src/controllers/platform-backup.controller.ts"),
      "utf8"
    );
    expect(serviceSource).toContain("identity: PlatformBackupIdentity");
    expect(serviceSource).toContain("identity: validated.manifest.identity");
    expect(serviceSource).toContain("[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}");
    expect(controllerSource).toContain("readInstalledBackupIdentity");
    expect(controllerSource).toContain("RESTORE_JOB_NOT_FOUND");
    expect(controllerSource).toContain("customerAuditActor(req)");
    expect(controllerSource).toContain("recordPlatformRestoreTerminalAudit(restoreJob)");
  });

  it("persists initiating actor metadata and reconciles terminal audit after backend restart", async () => {
    const serviceSource = await readFile(
      join(process.cwd(), "src/modules/platform-backup/platform-backup.service.ts"),
      "utf8"
    );
    const controllerSource = await readFile(
      join(process.cwd(), "src/controllers/platform-backup.controller.ts"),
      "utf8"
    );
    const appSource = await readFile(join(process.cwd(), "src/app.ts"), "utf8");
    expect(serviceSource).toContain("finalAuditEventId: randomUUID()");
    expect(serviceSource).toContain("reconcilePlatformRestoreAudits");
    expect(serviceSource).toContain("recordPlatformRestoreTerminalAudit");
    expect(serviceSource).toContain("recordOnce(job.audit.finalAuditEventId");
    expect(serviceSource).toContain("Platform restore job audit metadata is invalid");
    expect(controllerSource).toContain("recordPlatformRestoreTerminalAudit(restoreJob)");
    expect(controllerSource).not.toContain("recordOnce(restoreJob.jobId");
    expect(controllerSource).toContain('source: "platform-backup-restore"');
    expect(controllerSource).toContain('source: "platform-backup-dr"');
    expect(appSource).toContain("reconcilePlatformRestoreAudits()");
  });

  it("does not accept an Influx token as a command-line parameter", async () => {
    const backupSource = await readFile(
      join(process.cwd(), "../installer/windows/Invoke-PlatformInfluxBackup.ps1"),
      "utf8"
    );
    const restoreSource = await readFile(
      join(process.cwd(), "../installer/windows/Invoke-PlatformRestore.ps1"),
      "utf8"
    );
    expect(backupSource).not.toMatch(/\[Parameter\([^\n]+\)\]\[string\]\$Token/);
    expect(restoreSource).not.toMatch(/\[Parameter\([^\n]+\)\]\[string\]\$Token/);
    expect(backupSource).toContain("$env:INFLUX_TOKEN");
    expect(restoreSource).toContain("$env:INFLUX_TOKEN");
  });
});
