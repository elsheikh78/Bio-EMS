import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("DEP-BR controlled restore helper contract", () => {
  it("requires a safety snapshot, controlled service quiesce, health verification and rollback", async () => {
    const source = await readFile(
      join(process.cwd(), "../installer/windows/Invoke-PlatformRestore.ps1"),
      "utf8"
    );
    expect(source).toContain("restore-safety-");
    expect(source).toContain("Stop-ControlledServices");
    expect(source).toContain("Test-PostInstallHealth.ps1");
    expect(source).toContain("Platform restore failed; safety snapshot was restored");
    expect(source).toContain("InfluxDB restore failed");
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
