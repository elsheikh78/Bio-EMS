[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet("PreUpdate", "PostUpdate", "Uninstall", "NewInstallCleanup")][string]$Mode,
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot
)

$ErrorActionPreference = "Stop"
$application = [IO.Path]::GetFullPath($ApplicationRoot)
$persistent = [IO.Path]::GetFullPath($PersistentRoot)
$services = @("BIOEMS-Backend", "BIOEMS-InfluxDB", "BIOEMS-MQTT")
$pointer = Join-Path $persistent "logs\pending-lifecycle.json"

function Invoke-Robocopy([string]$source, [string]$destination) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    $copyOutput = & robocopy.exe $source $destination /MIR /XJ /R:2 /W:1 /NFL /NDL /NP 2>&1
    $copyExitCode = $LASTEXITCODE
    if ($copyExitCode -gt 7) {
        $detail = ($copyOutput | Out-String).Trim()
        throw "Controlled lifecycle copy failed: source=$source destination=$destination robocopyExitCode=$copyExitCode detail=$detail"
    }
}
function Stop-ControlledServices {
    foreach ($service in $services) { Stop-Service -Name $service -Force -ErrorAction SilentlyContinue }
}
function Grant-LifecycleAdministratorAccess([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
    & icacls.exe $path /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" /C /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to prepare BIO-EMS lifecycle access for $path (icacls exit code $LASTEXITCODE)"
    }
}
function Write-Utf8([string]$path, [object]$value) {
    [IO.File]::WriteAllText($path, ($value | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))
}
function Get-Manifest([string]$root) {
    return @(Get-ChildItem -LiteralPath $root -File -Recurse | Sort-Object FullName | ForEach-Object {
        [ordered]@{ relativePath = $_.FullName.Substring($root.Length).TrimStart('\'); sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    })
}

if ($Mode -eq "NewInstallCleanup") {
    # Destructive cleanup is deliberately a separate, explicit mode. Never infer it
    # from the presence of an old installation.
    $ownedPersistent = [IO.Path]::GetFullPath($persistent)
    $expectedPersistent = [IO.Path]::GetFullPath((Join-Path $env:ProgramData "BIO-EMS"))
    if (-not $ownedPersistent.Equals($expectedPersistent, [StringComparison]::OrdinalIgnoreCase)) {
        throw "New Install cleanup refuses a persistent root that is not the BIO-EMS ProgramData root"
    }

    Stop-ControlledServices
    foreach ($service in $services) {
        $wrapper = Join-Path $application "services\$service.exe"
        if (Test-Path -LiteralPath $wrapper) { & $wrapper uninstall 2>$null | Out-Null }
        if (Get-Service -Name $service -ErrorAction SilentlyContinue) {
            throw "New Install cleanup could not remove controlled service $service"
        }
    }

    Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue | Remove-NetFirewallRule

    $certificateEvidence = Join-Path $persistent "config\tls-certificate.json"
    if (Test-Path -LiteralPath $certificateEvidence -PathType Leaf) {
        & icacls.exe $certificateEvidence /grant "*S-1-5-32-544:(R)" /C /Q | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Unable to read BIO-EMS TLS certificate evidence during New Install cleanup" }
        $thumbprint = (Get-Content -LiteralPath $certificateEvidence -Raw | ConvertFrom-Json).thumbprint
        if ($thumbprint) {
            foreach ($store in @("Cert:\LocalMachine\My", "Cert:\LocalMachine\Root")) {
                Get-ChildItem $store | Where-Object Thumbprint -eq $thumbprint | Remove-Item -Force
            }
        }
    }

    if (Test-Path -LiteralPath $persistent) {
        $cleanupDiagnostic = Join-Path $env:TEMP "BIO-EMS-NewInstallCleanup.log"
        try {
            & takeown.exe /F $persistent /A /R /D Y | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "takeown failed with exit code $LASTEXITCODE" }

            & icacls.exe $persistent /inheritance:e /T /C /Q | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "ACL inheritance repair failed with exit code $LASTEXITCODE" }

            & icacls.exe $persistent /grant:r "*S-1-5-32-544:(OI)(CI)F" /T /C /Q | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Administrator ACL repair failed with exit code $LASTEXITCODE" }

            Get-ChildItem -LiteralPath $persistent -Force -Recurse -ErrorAction SilentlyContinue |
                ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly) }

            Remove-Item -LiteralPath $persistent -Recurse -Force
            if (Test-Path -LiteralPath $persistent) { throw "Persistent BIO-EMS directory still exists after controlled removal" }
            Remove-Item -LiteralPath $cleanupDiagnostic -Force -ErrorAction SilentlyContinue
        } catch {
            $detail = "BIO-EMS New Install cleanup failed at $((Get-Date).ToUniversalTime().ToString('o')): $($_.Exception.Message)"
            [IO.File]::WriteAllText($cleanupDiagnostic, $detail, (New-Object Text.UTF8Encoding($false)))
            Write-Error "$detail Diagnostic: $cleanupDiagnostic"
            exit 41
        }
    }
    Write-Host "BIO-EMS controlled New Install cleanup: PASS"
    exit 0
}

if ($Mode -eq "PreUpdate") {
    if (Test-Path -LiteralPath $pointer) { throw "A lifecycle operation is already pending" }
    $diagnostic = Join-Path $env:TEMP "BIO-EMS-PreUpdate.log"
    $backup = $null
    try {
        Stop-ControlledServices

        # Older BIO-EMS releases protected ProgramData with ACLs that can deny an
        # elevated installer from creating a lifecycle snapshot. Repair only the
        # product-owned backup/log roots needed by the update transaction; do not
        # relax customer data/config/licensing ACLs.
        $backupRoot = Join-Path $persistent "backups"
        $logsRoot = Join-Path $persistent "logs"
        Grant-LifecycleAdministratorAccess $backupRoot
        Grant-LifecycleAdministratorAccess $logsRoot

        # Legacy installs can leave service-owned child trees without an
        # inheritable Administrators ACE even though the current installer ACL
        # contract grants Administrators full control. Services are stopped at
        # this point, so normalize read access only on the BIO-EMS-owned roots
        # that must be captured by the verified lifecycle snapshot.
        foreach ($snapshotRootName in @("config", "data", "licensing")) {
            $snapshotRoot = Join-Path $persistent $snapshotRootName
            if (Test-Path -LiteralPath $snapshotRoot -PathType Container) {
                Grant-LifecycleAdministratorAccess $snapshotRoot
            }
        }

        $backup = Join-Path $backupRoot ("lifecycle-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ"))
        Invoke-Robocopy $application (Join-Path $backup "application")
        foreach ($name in @("config", "data", "licensing")) {
            $source = Join-Path $persistent $name
            if (Test-Path -LiteralPath $source) { Invoke-Robocopy $source (Join-Path $backup "persistent\$name") }
        }
        $manifest = [ordered]@{ schemaVersion = 1; createdAt = (Get-Date).ToUniversalTime().ToString("o"); application = Get-Manifest (Join-Path $backup "application"); persistent = Get-Manifest (Join-Path $backup "persistent") }
        Write-Utf8 (Join-Path $backup "backup-manifest.json") $manifest
        Write-Utf8 $pointer ([ordered]@{ schemaVersion = 1; backupPath = $backup; state = "VERIFIED_BACKUP_READY" })
        Remove-Item -LiteralPath $diagnostic -Force -ErrorAction SilentlyContinue
        Write-Host "DEP-01-05 verified pre-update backup: PASS"
        exit 0
    } catch {
        $detail = "BIO-EMS PreUpdate failed at $((Get-Date).ToUniversalTime().ToString('o')): $($_.Exception.Message)"
        [IO.File]::WriteAllText($diagnostic, $detail, (New-Object Text.UTF8Encoding($false)))
        $startOrder = @($services)
        [array]::Reverse($startOrder)
        foreach ($service in $startOrder) { Start-Service -Name $service -ErrorAction SilentlyContinue }
        Write-Error "$detail Diagnostic: $diagnostic"
        exit 42
    }
}

if ($Mode -eq "PostUpdate") {
    if (-not (Test-Path -LiteralPath $pointer -PathType Leaf)) { throw "Verified lifecycle backup pointer is missing" }
    $state = Get-Content -LiteralPath $pointer -Raw | ConvertFrom-Json
    $backup = [IO.Path]::GetFullPath($state.backupPath)
    if (-not $backup.StartsWith((Join-Path $persistent "backups"), [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path (Join-Path $backup "backup-manifest.json"))) { throw "Lifecycle backup is invalid" }
    try {
        $startOrder = @($services)
        [array]::Reverse($startOrder)
        foreach ($service in $startOrder) { Start-Service -Name $service -ErrorAction Stop }
        & (Join-Path $application "installer\Test-PostInstallHealth.ps1") -ApplicationRoot $application -PersistentRoot $persistent
        if ($LASTEXITCODE -ne 0) { throw "Post-update health failed" }
        $state.state = "UPDATE_HEALTH_VERIFIED"
        Write-Utf8 (Join-Path $persistent "logs\last-lifecycle.json") $state
        Remove-Item -LiteralPath $pointer -Force
    } catch {
        Stop-ControlledServices
        Invoke-Robocopy (Join-Path $backup "application") $application
        foreach ($name in @("config", "data", "licensing")) {
            $source = Join-Path $backup "persistent\$name"
            if (Test-Path -LiteralPath $source) { Invoke-Robocopy $source (Join-Path $persistent $name) }
        }
        $restoreStartOrder = @($services)
        [array]::Reverse($restoreStartOrder)
        foreach ($service in $restoreStartOrder) { Start-Service -Name $service -ErrorAction SilentlyContinue }
        throw "Update verification failed and the previous application/data snapshot was restored"
    }
    Write-Host "DEP-01-05 update lifecycle: PASS"
    exit 0
}

Stop-ControlledServices
foreach ($service in $services) {
    $wrapper = Join-Path $application "services\$service.exe"
    if (Test-Path -LiteralPath $wrapper) { & $wrapper uninstall 2>$null | Out-Null }
}
Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
$certificateEvidence = Join-Path $persistent "config\tls-certificate.json"
if (Test-Path -LiteralPath $certificateEvidence) {
    try {
        # BIO-EMS protects persistent configuration with restrictive ACLs. The
        # uninstall lifecycle must be able to read its own TLS evidence before
        # Inno removes the application payload.
        & icacls.exe $certificateEvidence /grant "*S-1-5-32-544:(R)" /C /Q | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Unable to grant temporary administrator read access to TLS certificate evidence" }

        $thumbprint = (Get-Content -LiteralPath $certificateEvidence -Raw | ConvertFrom-Json).thumbprint
        if ($thumbprint) {
            foreach ($store in @("Cert:\LocalMachine\My", "Cert:\LocalMachine\Root")) {
                Get-ChildItem $store | Where-Object Thumbprint -eq $thumbprint | Remove-Item -Force
            }
        }
    } catch {
        throw "Unable to remove BIO-EMS TLS certificate: $($_.Exception.Message)"
    }
}
$evidence = [ordered]@{ schemaVersion = 1; state = "APPLICATION_REMOVED_DATA_RETAINED"; retainedRoot = $persistent; completedAt = (Get-Date).ToUniversalTime().ToString("o") }
Write-Utf8 (Join-Path $persistent "logs\uninstall-retention.json") $evidence
Write-Host "BIO-EMS application removed; customer data and licensing identity retained"
