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
    expect(source).toContain("InfluxDB restore failed");
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
