import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  readAndValidateWindowsInstallerPackage,
  validateWindowsInstallerPackage,
  vendorInputLockSchema,
  WINDOWS_INSTALLER_ISSUES,
} from "./windows-installer-package";

const ids = ["backend", "frontend", "node", "mosquitto", "influxdb", "winsw"] as const;
const content = (id: string) => Buffer.from(`controlled-${id}`);
const checksum = (value: Buffer) => createHash("sha256").update(value).digest("hex");

function manifest() {
  return {
    schemaVersion: 1,
    product: "BIO-EMS",
    productVersion: "0.20.0",
    architecture: "x64",
    installerTechnology: "Inno Setup 6",
    generatedAt: "2026-09-07T00:00:00.000Z",
    sourceCommit: "a".repeat(40),
    artifacts: ids.map((id) => ({
      id,
      version: "controlled-version",
      relativePath: `payload/${id}.zip`,
      sha256: checksum(content(id)),
      redistributionEvidence: `licenses/${id}.txt`,
    })),
  };
}

function stage(input = manifest()) {
  const directory = mkdtempSync(join(tmpdir(), "bioems-installer-stage-"));
  for (const artifact of input.artifacts) {
    const path = join(directory, artifact.relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content(artifact.id));
  }
  writeFileSync(join(directory, "package-manifest.json"), JSON.stringify(input));
  return directory;
}

describe("DEP-01 controlled Windows installer package", () => {
  it("accepts exactly the six controlled, checksummed runtime/application inputs", () => {
    expect(readAndValidateWindowsInstallerPackage(stage())).toMatchObject({
      ready: true,
      issues: [],
    });
  });

  it("rejects an incomplete inventory before packaging", () => {
    const input = manifest();
    input.artifacts.pop();
    expect(validateWindowsInstallerPackage(input).issues).toContainEqual({
      code: WINDOWS_INSTALLER_ISSUES.MANIFEST_INVALID,
    });
  });

  it("rejects traversal, private material and reusable installation state", () => {
    for (const relativePath of [
      "../node.zip",
      "..\\node.zip",
      "C:\\secrets\\node.zip",
      "payload/.env",
      "payload/identity.json",
      "keys/root.private.pem",
    ]) {
      const input = manifest();
      input.artifacts[0].relativePath = relativePath;
      expect(validateWindowsInstallerPackage(input).ready).toBe(false);
    }
  });

  it("rejects missing or tampered staged artifacts", () => {
    const directory = stage();
    writeFileSync(join(directory, "payload", "backend.zip"), "tampered");
    expect(readAndValidateWindowsInstallerPackage(directory).issues).toContainEqual({
      code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_CHECKSUM_MISMATCH,
      artifactId: "backend",
    });
  });
});

describe("DEP-01-02 frozen inputs and build source", () => {
  const repositoryRoot = join(process.cwd(), "..");

  it("locks the exact four vendor inputs to HTTPS sources, versions and SHA-256", () => {
    const lock = JSON.parse(
      readFileSync(join(repositoryRoot, "installer/windows/vendor-input-lock.json"), "utf8")
    );
    expect(vendorInputLockSchema.parse(lock).inputs.map((input) => input.id)).toEqual([
      "node",
      "mosquitto",
      "influxdb",
      "winsw",
    ]);
  });

  it("keeps secret and reusable licensing state out of acquisition and staging scripts", () => {
    const scripts = ["Get-VendorInputs.ps1", "New-InstallerStaging.ps1", "Build-Setup.ps1"]
      .map((file) => readFileSync(join(repositoryRoot, "installer/windows", file), "utf8"))
      .join("\n");
    expect(scripts).toContain("Get-FileHash -Algorithm SHA256");
    expect(scripts).toContain("[string]$BuildTimestamp");
    expect(scripts).toContain("generatedAt = $BuildTimestamp");
    expect(scripts).not.toMatch(/BEGIN PRIVATE KEY|activation-receipt\.json|identity\.json/);
  });

  it("requires the pinned compiler, commercial license evidence and package validation", () => {
    const script = readFileSync(join(repositoryRoot, "installer/windows/Build-Setup.ps1"), "utf8");
    expect(script).toContain("Inno Setup compiler must have verified 6.7.3 package evidence");
    expect(script).toContain("CompilerPackageEvidence");
    expect(script).toContain("CommercialLicenseEvidence");
    expect(script).toContain("validate:windows-installer");
    expect(script).toContain("setupSha256");
  });

  it("requires a validated stage and controlled version at Inno compile time", () => {
    const source = readFileSync(join(repositoryRoot, "installer/windows/BioEMS.iss"), "utf8");
    expect(source).toContain("#error StageRoot must point to a validated DEP-01 staging directory");
    expect(source).toContain("#error ProductVersion must be supplied by the controlled build");
    expect(source).toContain("RedirectionGuard=yes");
    expect(source).not.toContain("LicenseFile=identity.json");
  });
});

describe("DEP-01-03 protected configuration and service lifecycle source", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const lifecycle = readFileSync(join(windowsRoot, "Install-DEP0103Services.ps1"), "utf8");
  const preStart = readFileSync(join(windowsRoot, "Invoke-BackendPreStart.ps1"), "utf8");

  it("installs the exact services under separate virtual service identities", () => {
    const contract = JSON.parse(readFileSync(join(windowsRoot, "package-contract.json"), "utf8"));
    expect(contract.serviceAccounts).toEqual({
      "BIOEMS-Backend": "NT SERVICE\\BIOEMS-Backend",
      "BIOEMS-MQTT": "NT SERVICE\\BIOEMS-MQTT",
      "BIOEMS-InfluxDB": "NT SERVICE\\BIOEMS-InfluxDB",
    });
    expect(lifecycle).toContain(
      '$serviceIds = @("BIOEMS-MQTT", "BIOEMS-InfluxDB", "BIOEMS-Backend")'
    );
    expect(lifecycle).toContain('"NT SERVICE\\$serviceId"');
    expect(lifecycle).toContain('sc.exe" @("sidtype"');
    expect(lifecycle).not.toMatch(/<password>|LocalSystem/);
  });

  it("fails closed before replacing a pre-existing Mosquitto service", () => {
    expect(lifecycle).toContain('Get-Service -Name "mosquitto"');
    expect(lifecycle).toContain("Fresh service installation refuses an existing Mosquitto service");
    expect(lifecycle.indexOf('Get-Service -Name "mosquitto"')).toBeLessThan(
      lifecycle.indexOf("Start-Process -FilePath $mosquittoInstaller")
    );
  });

  it("creates runtime credentials without command-line or repository secrets", () => {
    expect(lifecycle).toContain("RandomNumberGenerator");
    expect(lifecycle).toContain("RedirectStandardInput = $true");
    expect(lifecycle).toContain("BIOEMS_ENV_FILE = $backendEnv");
    expect(lifecycle).not.toMatch(/MQTT_PASSWORD=(?:password|secret)|BEGIN PRIVATE KEY/);
  });

  it("runs LIC-11 only under the final Backend service identity and fails closed", () => {
    expect(preStart).toContain("$identityExists -xor $receiptExists");
    expect(preStart).toContain("automatic replacement is prohibited");
    expect(preStart).toContain("& $NodeExecutable $ProvisioningScript");
    expect(lifecycle.indexOf('sc.exe" @("config"')).toBeLessThan(
      lifecycle.indexOf('Start-Service "BIOEMS-Backend"')
    );
  });

  it("wires service installation into Setup without granting users access to ProgramData", () => {
    const source = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
    expect(source).toContain("Install-DEP0103Services.ps1");
    expect(source).toContain("runhidden waituntilterminated");
    expect(source).not.toContain("Permissions: users-readexec");
    expect(readFileSync(join(repositoryRoot, "backend/src/config/config.ts"), "utf8")).toContain(
      "process.env.BIOEMS_ENV_FILE"
    );
    const bootstrap = readFileSync(
      join(repositoryRoot, "backend/src/scripts/start-windows-service.ts"),
      "utf8"
    );
    expect(bootstrap.indexOf("dotenv.config")).toBeLessThan(
      bootstrap.indexOf('import("../server")')
    );
  });
});

describe("DEP-01-04 HTTPS front-door, firewall and health source", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const lifecycle = readFileSync(join(windowsRoot, "Install-DEP0103Services.ps1"), "utf8");
  const health = readFileSync(join(windowsRoot, "Test-PostInstallHealth.ps1"), "utf8");

  it("creates a trusted local certificate and keeps its PFX secret out of source", () => {
    expect(lifecycle).toContain("New-SelfSignedCertificate");
    expect(lifecycle).toContain("Cert:\\LocalMachine\\Root");
    expect(lifecycle).toContain("BIOEMS_TLS_PFX_PASSPHRASE=$tlsPassword");
    expect(lifecycle).not.toMatch(/BEGIN CERTIFICATE|BIOEMS_TLS_PFX_PASSPHRASE=[A-Za-z0-9+/]{20}/);
  });

  it("opens only HTTPS to private local subnets", () => {
    expect(lifecycle).toContain(
      "-LocalPort 443 -Profile Domain,Private -RemoteAddress LocalSubnet"
    );
    expect(lifecycle).not.toMatch(/New-NetFirewallRule[^\n]+LocalPort (?:1883|3001|8086|8883)/);
  });

  it("records secret-free health evidence for every installed component", () => {
    for (const check of [
      "backend:https",
      "influxdb:health",
      "mqtt:loopback",
      "frontend:index",
      "licensing:identity",
      "licensing:receipt",
      "firewall:https-only",
    ]) {
      expect(health).toContain(check);
    }
    expect(health).toContain("post-install-health.json");
    expect(health).not.toMatch(/TOKEN|PASSWORD|PASSPHRASE/);
  });
});

describe("DEP-01-05 lifecycle recovery source", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const lifecycle = readFileSync(join(windowsRoot, "Invoke-DEP0105Lifecycle.ps1"), "utf8");
  const setup = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");

  it("creates SHA-256 inventory evidence before updating application or data", () => {
    expect(lifecycle).toContain("Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256");
    expect(lifecycle).toContain("VERIFIED_BACKUP_READY");
    expect(setup).toContain("PrepareToInstall");
    expect(setup).toContain("-Mode PreUpdate");
  });

  it("restores application, configuration, data and licensing after failed health", () => {
    expect(lifecycle).toContain('Invoke-Robocopy (Join-Path $backup "application") $application');
    expect(lifecycle).toContain('@("config", "data", "licensing")');
    expect(lifecycle).toContain("previous application/data snapshot was restored");
  });

  it("preserves persistent customer and licensing state during uninstall", () => {
    expect(lifecycle).toContain("APPLICATION_REMOVED_DATA_RETAINED");
    expect(lifecycle).toContain("uninstall-retention.json");
    expect(lifecycle).not.toMatch(/Remove-Item[^\n]+\$persistent[^\n]+Recurse/);
  });
});

describe("DEP-01-06 repeatable internal Windows artifact", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const workflow = readFileSync(
    join(repositoryRoot, ".github/workflows/windows-internal-setup.yml"),
    "utf8"
  );
  const guide = readFileSync(
    join(repositoryRoot, "installer/windows/INTERNAL-SETUP-TESTING.md"),
    "utf8"
  );

  it("builds and signs the BIO EGYPT pilot Setup on a controlled Windows runner", () => {
    expect(workflow).toContain("runs-on: windows-2022");
    expect(workflow).toContain("node-version: 22.22.0");
    expect(workflow).toContain("issrc/releases/download/is-6_7_3/innosetup-6.7.3.exe");
    expect(workflow).toContain("9c73c3bae7ed48d44112a0f48e66742c00090bdb5bef71d9d3c056c66e97b732");
    expect(workflow).toContain("Get-FileHash -LiteralPath $download -Algorithm SHA256");
    expect(workflow).toContain("BIOEMS_INNO_COMPILER=$compiler");
    expect(workflow).toContain("BIOEMS_INNO_COMPILER_EVIDENCE=$compilerEvidence");
    expect(workflow).toContain("Get-VendorInputs.ps1");
    expect(workflow).toContain("New-InstallerStaging.ps1");
    expect(workflow).toContain("Build-Setup.ps1");
    expect(workflow).toContain("New-SelfSignedCertificate");
    expect(workflow).toContain('Filter "signtool.exe"');
    expect(workflow).toContain("sign /fd SHA256 /sha1 $certificate.Thumbprint /s My");
    expect(workflow).toContain('$signature.Status -eq "NotSigned"');
    expect(workflow).toContain("$signature.SignerCertificate.Thumbprint");
    expect(workflow).toContain("BIO-EMS-Pilot-Code-Signing.cer");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("retention-days: 14");
  });

  it("ships a clean-machine guide without requesting production secrets", () => {
    expect(guide).toContain("disposable clean Windows 10/11");
    expect(guide).toContain("Get-Service mosquitto,BIOEMS-*");
    expect(guide).toContain("Install-PilotSigningCertificate.ps1");
    expect(guide).toContain("Install-BIOEMS-Pilot.cmd");
    expect(guide).toContain("CERTIFICATE-THUMBPRINT.txt");
    expect(guide).toContain("post-install-health.json");
    expect(guide).toContain("uninstall-retention.json");
    expect(guide).toContain("Do not enter production");
  });

  it("ships a one-click elevated pilot launcher that fails closed on an invalid signature", () => {
    const launcher = readFileSync(
      join(repositoryRoot, "installer/windows/Install-BIOEMS-Pilot.cmd"),
      "utf8"
    );
    expect(launcher).toContain("Start-Process -FilePath '%~f0' -Verb RunAs");
    expect(launcher).toContain("Install-PilotSigningCertificate.ps1");
    expect(launcher).toContain("$signature.Status -ne 'Valid'");
    expect(launcher).toContain("Expected exactly one BIO-EMS Setup executable");
    expect(launcher).toContain("goto :failed");
  });

  it("trusts only the matching, unexpired pilot code-signing certificate", () => {
    const trustScript = readFileSync(
      join(repositoryRoot, "installer/windows/Install-PilotSigningCertificate.ps1"),
      "utf8"
    );
    expect(trustScript).toContain("#Requires -RunAsAdministrator");
    expect(trustScript).toContain("BIO-EMS pilot certificate thumbprint mismatch");
    expect(trustScript).toContain("1.3.6.1.5.5.7.3.3");
    expect(trustScript).toContain("Cert:\\LocalMachine\\Root");
    expect(trustScript).toContain("Cert:\\LocalMachine\\TrustedPublisher");
  });
});
