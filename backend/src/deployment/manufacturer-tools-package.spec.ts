import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("standalone Manufacturer Tools package", () => {
  const root = join(process.cwd(), "..");
  const windows = join(root, "installer/windows");
  const signer = readFileSync(join(windows, "Invoke-ManufacturerOwnerSigner.ps1"), "utf8");
  const setup = readFileSync(join(windows, "ManufacturerTools.iss"), "utf8");
  const staging = readFileSync(join(windows, "New-ManufacturerToolsStaging.ps1"), "utf8");
  const workflow = readFileSync(
    join(root, ".github/workflows/windows-manufacturer-tools.yml"),
    "utf8"
  );

  it("runs without a source checkout after installation", () => {
    expect(signer).toContain("$installedMode");
    expect(signer).toContain("runtime\\node\\node.exe");
    expect(signer).toContain("issue-owner-commissioning-package.js");
    expect(signer).toContain("& $installedNode $installedIssuer");
  });

  it("packages only runtime code and never signing secrets", () => {
    expect(staging).toContain("npm ci --omit=dev");
    expect(staging).toContain("manufacturer-backend.zip");
    expect(setup).toContain("BIO-EMS-Manufacturer-Tools-Setup-");
    expect(setup).not.toMatch(/BEGIN PRIVATE KEY|PRIVATE_KEY_PASSPHRASE=/);
  });

  it("builds, signs, installs and inspects the standalone setup on Windows", () => {
    expect(workflow).toContain("runs-on: windows-2022");
    expect(workflow).toContain("Compile Manufacturer Tools Setup");
    expect(workflow).toContain("Sign and verify Setup");
    expect(workflow).toContain("Install and verify offline runtime");
    expect(workflow).toContain("Package contains prohibited private-key material");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });
});
