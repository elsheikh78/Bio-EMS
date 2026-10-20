import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("installer controller firmware source contract", () => {
  const root = join(process.cwd(), "..");
  const staging = readFileSync(join(root, "installer/windows/New-InstallerStaging.ps1"), "utf8");
  const workflow = readFileSync(join(root, ".github/workflows/windows-internal-setup.yml"), "utf8");

  it("cannot strand a new firmware version behind an older literal installer gate", () => {
    expect(staging).not.toMatch(/firmwareVersion\s+-ne\s+"[0-9.]+-pilot\.[0-9]+"/);
    expect(staging).toContain("Read-ControllerFirmwareContract.ps1");
    expect(staging).toContain(
      "$firmwareManifest.firmwareVersion -ne $firmwareContract.firmwareVersion"
    );
    expect(staging).toContain(
      "$firmwareManifest.protocolVersion -ne $firmwareContract.protocolVersion"
    );
    expect(staging).toContain(
      "$firmwareManifest.bindingSchemaVersion -ne $firmwareContract.bindingSchemaVersion"
    );
  });

  it("tests header evolution and rejection of ambiguous firmware identity on Windows", () => {
    expect(workflow).toContain("Test-ControllerFirmwareContract.ps1");
    expect(workflow).not.toMatch(/manifest\["firmwareVersion"\]\s*==\s*"[0-9.]+-pilot\.[0-9]+"/);
    const test = readFileSync(
      join(root, "installer/windows/Test-ControllerFirmwareContract.ps1"),
      "utf8"
    );
    expect(test).toContain("0.2.0-pilot.99");
    expect(test).toContain("Duplicate firmware identity was accepted");
  });
});
