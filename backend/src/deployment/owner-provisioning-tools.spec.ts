import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("System Owner provisioning Windows tools", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const provisioning = readFileSync(
    join(windowsRoot, "Invoke-SystemOwnerProvisioning.ps1"),
    "utf8"
  );
  const signer = readFileSync(join(windowsRoot, "Invoke-ManufacturerOwnerSigner.ps1"), "utf8");
  const setup = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");

  it("packages a visible local provisioning entry point", () => {
    expect(setup).toContain("Invoke-SystemOwnerProvisioning.ps1");
    expect(setup).toContain("BIO-EMS System Owner Provisioning");
    expect(provisioning).toContain("create-owner-commissioning-request.js");
    expect(provisioning).toContain("import-owner-commissioning-package.js");
  });

  it("pins provisioning to protected installed paths and requires elevation", () => {
    expect(provisioning).toContain("Test-Administrator");
    expect(provisioning).toContain("-Verb RunAs");
    expect(provisioning).toContain('Join-Path $env:ProgramFiles "BIO-EMS"');
    expect(provisioning).toContain('Join-Path $env:ProgramData "BIO-EMS"');
    expect(provisioning).toContain(
      "System Owner Provisioning only operates on the installed BIO-EMS paths."
    );
  });

  it("stops the backend only for signed package import and restores it afterwards", () => {
    expect(provisioning).toContain('Get-Service -Name "BIOEMS-Backend"');
    expect(provisioning).toContain('Stop-Service -Name "BIOEMS-Backend"');
    expect(provisioning).toContain('Start-Service -Name "BIOEMS-Backend"');
    expect(provisioning.indexOf("Stop-Service")).toBeGreaterThan(
      provisioning.indexOf("$importButton.Add_Click")
    );
  });

  it("surfaces the final native owner-tool diagnostic instead of masking the failure", () => {
    expect(provisioning).toContain("& $node $Script 2>&1");
    expect(provisioning).toContain("Select-Object -Last 1");
    expect(provisioning).toContain("throw [string]$detail");
  });

  it("keeps manufacturer signing material off the customer utility", () => {
    expect(provisioning).not.toContain("PRIVATE_KEY");
    expect(provisioning).not.toContain("PASSPHRASE");
    expect(provisioning).not.toContain("issue-owner-commissioning-package");
  });

  it("collects credentials only in the offline signer and clears secret fields", () => {
    expect(signer).toContain("BIOEMS_OWNER_COMMISSIONING_USERNAME");
    expect(signer).toContain("BIOEMS_OWNER_COMMISSIONING_PASSWORD");
    expect(signer).toContain("BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY_PASSPHRASE");
    expect(signer).toContain("$password.Clear()");
    expect(signer).toContain("$confirmation.Clear()");
    expect(signer).toContain("$passphrase.Clear()");
    expect(signer).not.toMatch(/console\.log|Write-Host.*(?:password|passphrase|private)/i);
  });
});
