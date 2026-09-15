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
    releaseChannel: "Pilot",
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

  it("requires the manufacturer trust artifact only for Production", () => {
    expect(
      validateWindowsInstallerPackage({ ...manifest(), releaseChannel: "Production" }).ready
    ).toBe(false);

    const production = {
      ...manifest(),
      releaseChannel: "Production",
      artifacts: [
        ...manifest().artifacts,
        {
          id: "owner-commissioning-trust",
          version: "1",
          relativePath: "payload/manufacturer-owner-trust.json",
          sha256: checksum(content("owner-commissioning-trust")),
          redistributionEvidence: "BIO-EMS-MANUFACTURER-PUBLIC-KEYS",
        },
      ],
    };
    expect(validateWindowsInstallerPackage(production).ready).toBe(true);

    production.releaseChannel = "Pilot";
    expect(validateWindowsInstallerPackage(production).ready).toBe(false);
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

  it("fails closed for Production without an approved owner trust keyring", () => {
    const staging = readFileSync(
      join(repositoryRoot, "installer/windows/New-InstallerStaging.ps1"),
      "utf8"
    );
    const setup = readFileSync(join(repositoryRoot, "installer/windows/BioEMS.iss"), "utf8");

    expect(staging).toContain('[ValidateSet("Pilot", "Production")]');
    expect(staging).toContain("Production staging requires an owner commissioning trust keyring");
    expect(staging).toContain("Pilot staging must not embed the Production owner trust keyring");
    expect(staging).toContain("Production trust keyring requires at least one active key");
    expect(staging).toContain('id = "owner-commissioning-trust"');
    expect(staging).toContain("releaseChannel = $ReleaseChannel");
    expect(setup).toContain("manufacturer-owner-trust.json");
    expect(setup).toContain("{commonappdata}\\BIO-EMS\\licensing");
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

  it("keeps service rollback PowerShell 5.1 compatible", () => {
    expect(lifecycle).not.toContain("Select-Object -Reverse");
    expect(lifecycle).toContain("[array]::Reverse($rollbackServiceIds)");
    expect(lifecycle).toContain("$failure = $_");
    expect(lifecycle).toContain("$failure.Exception.Message");
  });

  it("writes WinSW XML without a UTF-16 declaration before UTF-8 persistence", () => {
    expect(lifecycle).toContain("$settings.OmitXmlDeclaration = $true");
    expect(lifecycle).not.toContain("$settings.Encoding = New-Object Text.UTF8Encoding($false)");
    expect(lifecycle).toContain('Write-Utf8 (Join-Path $paths.Services "BIOEMS-MQTT.xml")');
  });

  it("fails closed before replacing a pre-existing Mosquitto service", () => {
    expect(lifecycle).toContain('Get-Service -Name "mosquitto"');
    expect(lifecycle).toContain("Fresh service installation refuses an existing Mosquitto service");
    expect(lifecycle.indexOf('Get-Service -Name "mosquitto"')).toBeLessThan(
      lifecycle.indexOf("Start-Process -FilePath $mosquittoInstaller")
    );
  });

  it("preserves administrator access to WinSW wrappers and rollback root-cause diagnostics", () => {
    expect(lifecycle).toContain(
      'Add-PrincipalAccess $paths.Services "BUILTIN\\Administrators" "(OI)(CI)F"'
    );
    expect(lifecycle).toContain("Rollback could not execute {0} wrapper: {1}");
    expect(lifecycle).toContain("$failure = $_");
    expect(lifecycle).toContain("$failure.Exception.Message");
  });

  it("repairs stale services-directory ACLs before copying or executing WinSW wrappers", () => {
    const repairIndex = lifecycle.indexOf(
      'Invoke-Controlled "icacls.exe" @($paths.Services, "/grant:r", "BUILTIN\\Administrators:(OI)(CI)F")'
    );
    const wrapperCopyIndex = lifecycle.indexOf(
      "Copy-Item -LiteralPath $winswSource -Destination $wrapper -Force"
    );
    const wrapperInstallIndex = lifecycle.indexOf(
      'Invoke-Controlled $wrappers[$serviceId] @("install")'
    );

    expect(repairIndex).toBeGreaterThan(-1);
    expect(repairIndex).toBeLessThan(wrapperCopyIndex);
    expect(repairIndex).toBeLessThan(wrapperInstallIndex);
  });

  it("does not mis-prefix the built-in Administrators principal as a virtual service account", () => {
    expect(lifecycle).toContain("function Add-PrincipalAccess");
    expect(lifecycle).toContain('"BUILTIN\\Administrators"');
    expect(lifecycle).not.toContain("NT SERVICE\\Administrators");
  });

  it("configures Windows virtual service accounts without an empty password argument", () => {
    expect(lifecycle).toContain(
      'Invoke-Controlled "sc.exe" @("config", $serviceId, "obj=", "NT SERVICE\\$serviceId")'
    );
    expect(lifecycle).not.toContain('"password=", ""');
  });

  it("reports controlled command failures with safe executable and exit context", () => {
    expect(lifecycle).toContain(
      "Controlled command failed: executable=$file exitCode=$LASTEXITCODE"
    );
    expect(lifecycle).toContain("'<redacted>'");
    expect(lifecycle).toMatch(/password\|passphrase\|secret\|token/i);
    expect(lifecycle).not.toContain('throw "Controlled command failed"');
  });

  it("reclaims stale WinSW wrapper and XML files before service regeneration", () => {
    expect(lifecycle).toContain("Remove-InstallerManagedFile $wrapper");
    expect(lifecycle).toContain("Remove-InstallerManagedFile $xmlPath");
    expect(lifecycle).toContain("Copy-Item -LiteralPath $winswSource -Destination $wrapper -Force");
  });

  it("reclaims stale installer-managed files before deleting them on retry", () => {
    expect(lifecycle).toContain('Invoke-Controlled "takeown.exe" @("/F", $path, "/A")');
    expect(lifecycle).toContain(
      'Invoke-Controlled "icacls.exe" @($path, "/grant:r", "Administrators:F")'
    );
    expect(lifecycle).toContain("Remove-Item -LiteralPath $path -Force");
  });

  it("removes stale installer-managed config files before a fresh retry", () => {
    expect(lifecycle).toContain("function Remove-InstallerManagedFile");
    for (const managed of [
      "$mqttPasswordFile",
      "$mqttConfig",
      "$backendEnv",
      "$tlsPfx",
      "$publicCertificate",
      "$tlsMetadata",
    ]) {
      expect(lifecycle).toContain(`Remove-InstallerManagedFile ${managed}`);
    }
  });

  it("makes InfluxDB onboarding retry-safe by persisting and reusing the bootstrap token", () => {
    expect(lifecycle).toContain(
      '$influxTokenFile = Join-Path $paths.Config "influx-bootstrap.token"'
    );
    expect(lifecycle).toContain(
      '$setupStatus = Invoke-RestMethod -Uri "http://127.0.0.1:8086/api/v2/setup" -Method Get'
    );
    expect(lifecycle).toContain("if ($setupStatus.allowed -eq $true)");
    expect(lifecycle).toContain("Write-Utf8 $influxTokenFile $influxToken");
    expect(lifecycle).toContain('Protect-Path $influxTokenFile "BIOEMS-Backend" "R"');
    expect(lifecycle).toContain("elseif (Test-Path -LiteralPath $influxTokenFile -PathType Leaf)");
    expect(lifecycle).toContain("controlled recovery is required");
    expect(lifecycle).toContain("INFLUX_TOKEN=$influxToken");
    expect(lifecycle).not.toContain("INFLUX_TOKEN=$($setup.auth.token)");
  });

  it("creates runtime credentials without command-line or repository secrets", () => {
    expect(lifecycle).toContain("RandomNumberGenerator");
    expect(lifecycle).toContain('Invoke-Controlled $executable @("-U", $temporary)');
    expect(lifecycle).toContain('Invoke-Controlled "icacls.exe"');
    expect(lifecycle).toContain("Remove-Item -LiteralPath $temporary");
    expect(lifecycle).not.toContain("RedirectStandardInput = $true");
    expect(lifecycle).not.toMatch(
      /mosquitto_passwd[^\n]+-b|MQTT_PASSWORD=(?:password|secret)|BEGIN PRIVATE KEY/
    );
    expect(lifecycle).toContain("BIOEMS_ENV_FILE = $backendEnv");
  });

  it("binds Windows installation identity protection to the local machine for service-account provisioning", () => {
    const keyProtection = readFileSync(
      join(repositoryRoot, "backend/src/modules/licensing/key-protection.ts"),
      "utf8"
    );
    expect(keyProtection).toContain("WINDOWS-DPAPI/LOCAL-MACHINE");
    expect(keyProtection).toContain("[System.Security.Cryptography.ProtectedData]");
    expect(keyProtection).toContain(
      "[System.Security.Cryptography.DataProtectionScope]::LocalMachine"
    );
    expect(keyProtection).not.toContain("WINDOWS-DPAPI/CURRENT-USER");
    expect(keyProtection).not.toContain("DataProtectionScope]::CurrentUser");
    expect(preStart).toContain(
      "LIC-11 installation identity provisioning failed under service identity"
    );
    expect(preStart).toContain('Write-Diagnostic "FATAL:');
  });

  it("runs LIC-11 from the Backend service launcher instead of a WinSW prestart hook", () => {
    expect(lifecycle).toContain(
      'New-ServiceXml "BIOEMS-Backend" "powershell.exe" $backendLauncherArgs'
    );
    expect(lifecycle).toContain('-BackendScript `"$backendServer`"');
    expect(preStart).toContain('Write-Diagnostic "LIC-11 launcher entered"');
    expect(preStart).toContain("& $NodeExecutable $BackendScript");
  });

  it("persists LIC-11 prestart diagnostics so rollback does not hide the root cause", () => {
    expect(lifecycle).toContain(
      '$licensingDiagnosticLog = Join-Path $paths.Logs "lic11-prestart.log"'
    );
    expect(lifecycle).toContain('-DiagnosticLogPath `"$licensingDiagnosticLog`"');
    expect(preStart).toContain("[Parameter(Mandatory = $true)][string]$DiagnosticLogPath");
    expect(preStart).toContain('Write-Diagnostic "provisioner: $line"');
    expect(preStart).toContain(
      'Write-Diagnostic "installation identity provisioner exitCode=$provisionExitCode"'
    );
    expect(preStart).toContain('Write-Diagnostic "FATAL:');
    const provisioning = readFileSync(
      join(repositoryRoot, "backend/src/scripts/provision-installation-identity.ts"),
      "utf8"
    );
    expect(provisioning).toContain("Installation identity provisioning failed:");
  });

  it("persists the launcher identity, stage, provisioner output, and fatal exception", () => {
    expect(preStart).toContain('Write-Diagnostic "service identity=');
    expect(preStart).toContain('Write-Diagnostic "required executable/script files verified"');
    expect(preStart).toContain('Write-Diagnostic "licensing directories verified"');
    expect(preStart).toContain('Write-Diagnostic "starting installation identity provisioner"');
    expect(preStart).toContain('Write-Diagnostic "provisioner: $line"');
    expect(preStart).toContain('Write-Diagnostic "FATAL:');
    expect(preStart).toContain("exit 1");
  });

  it("runs LIC-11 only under the final Backend service identity and fails closed", () => {
    expect(preStart).toContain("$identityExists -xor $receiptExists");
    expect(preStart).toContain("automatic replacement is prohibited");
    expect(preStart).toContain("& $NodeExecutable $ProvisioningScript");
    expect(preStart).toContain("& $NodeExecutable $BackendScript");
    expect(lifecycle.indexOf('sc.exe" @("config"')).toBeLessThan(
      lifecycle.indexOf('Start-Service "BIOEMS-Backend"')
    );
  });

  it("verifies the Backend service SID has licensing ACL access before service start", () => {
    expect(lifecycle).toContain(
      'if ($licensingAcl -notmatch [regex]::Escape("NT SERVICE\\BIOEMS-Backend"))'
    );
    expect(lifecycle).toContain('"BIOEMS-Backend licensing ACL verification failed"');
  });

  it("recreates the HTTPS firewall rule safely and removes it on failed installation", () => {
    expect(lifecycle).toContain(
      'Remove-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue'
    );
    expect(lifecycle).toContain("$firewallRuleCreated = $true");
    expect(lifecycle).toContain("if ($firewallRuleCreated)");
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

  it("opens HTTPS directly from Setup and installed shortcuts", () => {
    const source = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
    expect(source).toContain('Filename: "https://localhost/"; Description: "Open BIO-EMS"');
    expect(source).toContain('Name: "{group}\\BIO-EMS"; Filename: "https://localhost/"');
    expect(source).toContain('Name: "{commondesktop}\\BIO-EMS"; Filename: "https://localhost/"');
