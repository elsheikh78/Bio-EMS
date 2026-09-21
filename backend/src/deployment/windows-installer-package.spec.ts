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

const ids = [
  "backend",
  "frontend",
  "node",
  "mosquitto",
  "influxdb",
  "winsw",
  "influx-cli",
] as const;
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
  it("accepts exactly the seven controlled, checksummed runtime/application inputs", () => {
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

  it("locks the exact vendor inputs to HTTPS sources, versions and SHA-256", () => {
    const lock = JSON.parse(
      readFileSync(join(repositoryRoot, "installer/windows/vendor-input-lock.json"), "utf8")
    );
    expect(vendorInputLockSchema.parse(lock).inputs.map((input) => input.id)).toEqual([
      "node",
      "mosquitto",
      "influxdb",
      "winsw",
      "influx-cli",
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
  const setup = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
  const adminBootstrap = readFileSync(join(windowsRoot, "Initialize-PilotAdmin.ps1"), "utf8");
  const workflow = readFileSync(
    join(repositoryRoot, ".github/workflows/windows-internal-setup.yml"),
    "utf8"
  );
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

  it("grants the Backend service durable access to SQLite data across administrator bootstrap", () => {
    expect(lifecycle).toContain('Protect-Path $paths.Data "BIOEMS-Backend"');
    expect(lifecycle.indexOf('Protect-Path $paths.Data "BIOEMS-Backend"')).toBeLessThan(
      lifecycle.indexOf('Start-Service "BIOEMS-Backend"')
    );
  });

  it("runs silent CI administrator bootstrap inside elevated Setup exactly once", () => {
    expect(setup).toContain("Trim(GetEnv('BIOEMS_CI_ADMIN_USERNAME')) <> ''");
    expect(setup).toContain("GetEnv('BIOEMS_CI_ADMIN_PASSWORD') <> ''");
    expect(workflow).not.toContain("-CredentialFile $credentialFile");
    expect(workflow).toContain(
      "BIO-EMS elevated customer administrator bootstrap did not report exit code 0"
    );
  });

  it("collects customer and site identity and passes it through the controlled service installer", () => {
    for (const field of [
      "Customer name:",
      "Customer code:",
      "Site name:",
      "Site code:",
      "Site location (optional):",
      "Contact name (optional):",
      "Contact email (optional):",
      "Contact phone (optional):",
    ]) {
      expect(setup).toContain(field);
    }
    expect(setup).toContain('-CustomerName ""{code:GetCustomerName}""');
    expect(setup).toContain('-CustomerCode ""{code:GetCustomerCode}""');
    expect(setup).toContain('-SiteName ""{code:GetSiteName}""');
    expect(setup).toContain('-SiteCode ""{code:GetSiteCode}""');
    expect(lifecycle).toContain("[string]$CustomerName");
    expect(lifecycle).toContain("[string]$CustomerCode");
    expect(lifecycle).toContain("[string]$SiteName");
    expect(lifecycle).toContain("[string]$SiteCode");
    expect(lifecycle).toContain("BIOEMS_INSTALLATION_CUSTOMER_NAME=$CustomerName");
    expect(lifecycle).toContain("BIOEMS_INSTALLATION_SITE_CODE=$SiteCode");
    expect(lifecycle).not.toContain('$bootstrapCustomerCode = "INSTALLATION-CUSTOMER"');
    expect(lifecycle).not.toContain('$bootstrapCustomerName = "BIO-EMS Customer"');
  });

  it("reads the Inno Setup credential handoff using its UTF-8 encoding", () => {
    expect(setup).toContain("Username + #13#10 + Email + #13#10 + Password");
    expect(adminBootstrap).toContain(
      "[IO.File]::ReadAllLines($CredentialFile, [Text.Encoding]::UTF8)"
    );
    expect(adminBootstrap).not.toContain("[Text.Encoding]::Unicode");
  });

  it("prepares elevated database access before bootstrap and restores protected SQLite ACLs", () => {
    const prepareIndex = adminBootstrap.indexOf(
      '& icacls.exe $dataDirectory /grant:r "BUILTIN\\Administrators:(OI)(CI)F"'
    );
    const nodeIndex = adminBootstrap.indexOf("& $nodes[0].FullName $script 2>&1");
    expect(prepareIndex).toBeGreaterThan(-1);
    expect(prepareIndex).toBeLessThan(nodeIndex);
    expect(adminBootstrap).not.toContain("/T /C");
    expect(adminBootstrap).toContain("& takeown.exe /F $_.FullName /A");
    expect(adminBootstrap.indexOf("& takeown.exe /F $_.FullName /A")).toBeLessThan(nodeIndex);
    expect(adminBootstrap).toContain('-Filter "bioems.db*" -File');
    expect(adminBootstrap).toContain(
      '& icacls.exe $_.FullName /inheritance:r /grant:r "SYSTEM:F" "BUILTIN\\Administrators:F" "NT SERVICE\\BIOEMS-Backend:M"'
    );
    expect(adminBootstrap).toContain('& icacls.exe $_.FullName /setowner "SYSTEM"');
    expect(
      adminBootstrap.indexOf("Backend database-file access could not be restored")
    ).toBeLessThan(adminBootstrap.indexOf('Start-Service -Name "BIOEMS-Backend"'));
  });

  it("prints bootstrap subprocess diagnostics into the elevated Setup log", () => {
    expect(setup.match(/Flags: runhidden waituntilterminated logoutput/g)?.length).toBe(2);
    expect(adminBootstrap).toContain('Write-Host "BIO-EMS admin bootstrap: $message"');
    expect(adminBootstrap).toContain("$bootstrapOutput = @(& $nodes[0].FullName $script 2>&1)");
    expect(adminBootstrap).toContain(
      '$bootstrapOutput | ForEach-Object { Write-Diagnostic "node: $_" }'
    );
    expect(adminBootstrap).toContain('& icacls.exe $logPath /grant:r "$installerPrincipal`:R"');
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

  it("uses language-independent well-known SIDs for protected SYSTEM and Administrators ACLs", () => {
    expect(lifecycle).toContain('"*S-1-5-18:F"');
    expect(lifecycle).toContain('"*S-1-5-32-544:F"');
    expect(lifecycle).toContain('"*S-1-5-32-544:(OI)(CI)F"');
    expect(lifecycle).not.toContain('"SYSTEM:F", "Administrators:F"');
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
      'Invoke-Controlled "icacls.exe" @($path, "/grant:r", "*S-1-5-32-544:F")'
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

  it("opens HTTPS through the cache-safe bootstrap from Setup and installed shortcuts", () => {
    const source = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
    expect(source).toContain(
      'Filename: "https://localhost/__bioems/start"; Description: "Open BIO-EMS"'
    );
    expect(source).toContain(
      'Name: "{group}\\BIO-EMS"; Filename: "https://localhost/__bioems/start"'
    );
    expect(source).toContain(
      'Name: "{commondesktop}\\BIO-EMS"; Filename: "https://localhost/__bioems/start"'
    );
  });
});

describe("DEP-01-04 HTTPS front-door, firewall and health source", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const lifecycle = readFileSync(join(windowsRoot, "Install-DEP0103Services.ps1"), "utf8");
  const health = readFileSync(join(windowsRoot, "Test-PostInstallHealth.ps1"), "utf8");

  it("normalizes the exported public certificate ACL before certutil reads it", () => {
    const exportIndex = lifecycle.indexOf(
      "Export-Certificate -Cert $certificate -FilePath $publicCertificate -Force"
    );
    const protectIndex = lifecycle.indexOf('Protect-Path $publicCertificate "BIOEMS-Backend" "R"');
    const trustIndex = lifecycle.indexOf(
      'Invoke-Controlled "certutil.exe" @("-addstore", "-f", "Root", $publicCertificate)'
    );

    expect(exportIndex).toBeGreaterThan(-1);
    expect(protectIndex).toBeGreaterThan(exportIndex);
    expect(trustIndex).toBeGreaterThan(protectIndex);
  });

  it("uses certutil for machine Root trust installation instead of the PowerShell certificate provider", () => {
    expect(lifecycle).toContain(
      'Invoke-Controlled "certutil.exe" @("-addstore", "-f", "Root", $publicCertificate)'
    );
    expect(lifecycle).not.toContain(
      'Import-Certificate -FilePath $publicCertificate -CertStoreLocation "Cert:\\LocalMachine\\Root"'
    );
  });

  it("makes the TLS private key explicitly exportable and reports certificate-stage failures precisely", () => {
    expect(lifecycle).toContain("-KeyExportPolicy Exportable");
    expect(lifecycle).toContain("TLS certificate creation failed:");
    expect(lifecycle).toContain("TLS PFX export failed:");
    expect(lifecycle).toContain("TLS public certificate export failed:");
    expect(lifecycle).toContain(
      'Invoke-Controlled "certutil.exe" @("-addstore", "-f", "Root", $publicCertificate)'
    );
    expect(lifecycle).toContain("TLS trust-store import failed:");
  });

  it("creates a trusted local certificate and keeps its PFX secret out of source", () => {
    expect(lifecycle).toContain("New-SelfSignedCertificate");
    expect(lifecycle).toContain(
      'Invoke-Controlled "certutil.exe" @("-addstore", "-f", "Root", $publicCertificate)'
    );
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

  it("uses PowerShell 5.1-compatible service start order", () => {
    expect(lifecycle).not.toContain("Select-Object -Reverse");
    expect(lifecycle).toContain("[array]::Reverse($startOrder)");
    expect(lifecycle).toContain("[array]::Reverse($restoreStartOrder)");
  });

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

  it("does not mistake successful robocopy exit codes for health failures", () => {
    expect(lifecycle).toContain(
      '& (Join-Path $application "installer\\Test-PostInstallHealth.ps1") @healthArgs'
    );
    expect(lifecycle).not.toContain(
      'if ($LASTEXITCODE -ne 0) { throw "Recovered lifecycle snapshot health failed" }'
    );
    expect(lifecycle).not.toContain(
      'if ($LASTEXITCODE -ne 0) { throw "Post-update health failed" }'
    );
    expect(lifecycle).toContain("successful robocopy values 1-7");
  });

  it("reclaims verified backup ACLs before pending recovery and rollback restore", () => {
    expect(lifecycle).toContain("function Grant-LifecycleTreeRestoreAccess");
    expect(lifecycle).toContain("& takeown.exe /F $path /A /R /D Y");
    expect(lifecycle).toContain(
      '& icacls.exe $path /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" /T /C /Q'
    );
    expect(lifecycle).toContain("Grant-LifecycleTreeRestoreAccess $pendingBackup");
    expect(lifecycle).toContain("Grant-LifecycleTreeRestoreAccess $backup");
    expect(lifecycle).toContain(
      'Grant-LifecycleFileReadAccess (Join-Path $pendingBackup "persistent\\data\\mqtt\\mosquitto.db")'
    );
    expect(lifecycle).toContain(
      'Grant-LifecycleFileReadAccess (Join-Path $backup "persistent\\data\\mqtt\\mosquitto.db")'
    );
    expect(
      lifecycle.match(
        /Grant-LifecycleFileReadAccess \(Join-Path \$persistent "data\\mqtt\\mosquitto\.db"\)/g
      )
    ).toHaveLength(3);
    expect(lifecycle.indexOf("Grant-LifecycleTreeRestoreAccess $pendingBackup")).toBeLessThan(
      lifecycle.indexOf('Invoke-Robocopy (Join-Path $pendingBackup "application") $application')
    );
    expect(lifecycle.indexOf("Grant-LifecycleTreeRestoreAccess $backup")).toBeLessThan(
      lifecycle.lastIndexOf('Invoke-Robocopy (Join-Path $backup "application") $application')
    );
  });

  it("preserves persistent customer and licensing state during uninstall", () => {
    expect(lifecycle).toContain("APPLICATION_REMOVED_DATA_RETAINED");
    expect(lifecycle).toContain("uninstall-retention.json");
    const uninstallBlock = lifecycle.slice(lifecycle.indexOf('if ($Mode -eq "Uninstall")'));
    expect(uninstallBlock).not.toMatch(/Remove-Item[^\n]+\$persistent[^\n]+Recurse/);
  });
});

describe("DEP-BR explicit installer mode contract", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const setup = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
  const lifecycle = readFileSync(join(windowsRoot, "Invoke-DEP0105Lifecycle.ps1"), "utf8");

  it("offers New Install and Reinstall / Repair explicitly", () => {
    expect(setup).toContain("'Installation Mode'");
    expect(setup).toContain("InstallModePage.Add('New Install')");
    expect(setup).toContain("InstallModePage.Add('Reinstall / Repair')");
    expect(setup).toContain("BIOEMS_CI_INSTALL_MODE");
  });

  it("rejects repair when no complete existing installation is detected", () => {
    expect(setup).toContain(
      "if ExistingInstallAtStart and ServicesPresentAtStart then InstallModePage.SelectedValueIndex := 1"
    );
    expect(setup).toContain(
      "No existing BIO-EMS installation was detected. Select New Install."
    );
    expect(setup).toContain(
      "BIO-EMS Repair requires a complete existing installation. Partial BIO-EMS state was detected."
    );
    expect(setup).toContain(
      "BIO-EMS silent Repair rejected: a complete existing installation was not detected."
    );
  });

  it("requires explicit confirmation before destructive New Install cleanup", () => {
    expect(setup).toContain("Existing BIO-EMS state was detected");
    expect(setup).toContain("mbConfirmation, MB_YESNO");
    expect(setup).toContain("NewInstallCleanupRequired := Result");
    expect(setup).toContain("-Mode NewInstallCleanup");
  });

  it("fails closed unless cleanup targets the BIO-EMS ProgramData root", () => {
    expect(lifecycle).toContain('"NewInstallCleanup"');
    expect(lifecycle).toContain('Join-Path $env:ProgramData "BIO-EMS"');
    expect(lifecycle).toContain("New Install cleanup refuses a persistent root");
    expect(lifecycle).toContain("Remove-Item -LiteralPath $persistent -Recurse -Force");
  });

  it("removes only product-owned services, firewall and evidenced TLS certificate", () => {
    expect(lifecycle).toContain(
      '$services = @("BIOEMS-Backend", "BIOEMS-InfluxDB", "BIOEMS-MQTT")'
    );
    expect(lifecycle).toContain('Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS"');
    expect(lifecycle).toContain('"config\\tls-certificate.json"');
    expect(lifecycle).toContain("Where-Object Thumbprint -eq $thumbprint");
  });

  it("routes repair through preservation lifecycle and never NewInstallCleanup", () => {
    expect(setup).toContain(
      "IsRepairSelected() and ExistingInstallAtStart and ServicesPresentAtStart"
    );
    expect(setup).toContain("-Mode PreUpdate");
    expect(setup).toContain("-Mode PostUpdate");
    expect(lifecycle).toContain("VERIFIED_BACKUP_READY");
    expect(lifecycle).toContain('@("config", "data", "licensing")');
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

describe("DEP-BR packaged restore helper contract", () => {
  const repositoryRoot = join(process.cwd(), "..");
  const windowsRoot = join(repositoryRoot, "installer/windows");
  const setup = readFileSync(join(windowsRoot, "BioEMS.iss"), "utf8");
  const services = readFileSync(join(windowsRoot, "Install-DEP0103Services.ps1"), "utf8");

  it("packages the backup and restore helpers and configures deterministic runtime paths", () => {
    expect(setup).toContain("Invoke-PlatformInfluxBackup.ps1");
    expect(setup).toContain("Invoke-PlatformRestore.ps1");
    expect(services).toContain(
      "BIOEMS_INFLUX_BACKUP_SCRIPT=$application\\installer\\Invoke-PlatformInfluxBackup.ps1"
    );
    expect(services).toContain(
      "BIOEMS_PLATFORM_RESTORE_SCRIPT=$application\\installer\\Invoke-PlatformRestore.ps1"
    );
    expect(services).toContain("BIOEMS_APPLICATION_ROOT=$application");
    expect(services).toContain("BIOEMS_PERSISTENT_ROOT=$persistent");
  });
});
