[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet("PreUpdate", "PostUpdate", "Uninstall", "NewInstallCleanup")][string]$Mode,
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [switch]$PilotMode
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
    foreach ($service in $services) {
        Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
        $deadline = (Get-Date).AddSeconds(30)
        do {
            $current = Get-Service -Name $service -ErrorAction SilentlyContinue
            if (-not $current -or $current.Status -eq "Stopped") { break }
            Start-Sleep -Milliseconds 250
        } while ((Get-Date) -lt $deadline)
        if ($current -and $current.Status -ne "Stopped") {
            throw "BIO-EMS lifecycle could not quiesce service $service before snapshot"
        }
    }

    # Mosquitto persists mosquitto.db during shutdown. A service can report
    # Stopped before the child broker process has fully released its database
    # handle, especially on legacy installations. Do not snapshot until the
    # controlled runtime process has actually exited.
    $mqttRuntime = Join-Path $application "runtime\mosquitto"
    $processDeadline = (Get-Date).AddSeconds(30)
    do {
        $mqttProcesses = @(Get-Process -Name "mosquitto" -ErrorAction SilentlyContinue | Where-Object {
            try { $_.Path -and $_.Path.StartsWith($mqttRuntime, [StringComparison]::OrdinalIgnoreCase) } catch { $false }
        })
        if ($mqttProcesses.Count -eq 0) { break }
        Start-Sleep -Milliseconds 250
    } while ((Get-Date) -lt $processDeadline)
    if ($mqttProcesses.Count -gt 0) {
        throw "BIO-EMS lifecycle could not quiesce the controlled Mosquitto process before snapshot"
    }
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
function Grant-LifecycleFileReadAccess([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return }
    & takeown.exe /F $path /A | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to take ownership of legacy BIO-EMS lifecycle file $path (takeown exit code $LASTEXITCODE)"
    }
    & icacls.exe $path /grant:r "*S-1-5-18:F" "*S-1-5-32-544:F" /C /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to grant lifecycle read access to legacy BIO-EMS file $path (icacls exit code $LASTEXITCODE)"
    }
}
function Grant-LifecycleTreeRestoreAccess([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Container)) { return }
    & takeown.exe /F $path /A /R /D Y | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to take ownership of verified BIO-EMS lifecycle backup $path (takeown exit code $LASTEXITCODE)"
    }
    & icacls.exe $path /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" /T /C /Q | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to grant restore access to verified BIO-EMS lifecycle backup $path (icacls exit code $LASTEXITCODE)"
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
    $diagnostic = Join-Path $env:TEMP "BIO-EMS-PreUpdate.log"
    $backup = $null
    try {
        # A previous update can leave a verified pointer behind when its
        # post-update health gate fails after restoring the previous snapshot.
        # Before starting another repair, deterministically restore and verify
        # that snapshot instead of deadlocking every future PreUpdate.
        if (Test-Path -LiteralPath $pointer -PathType Leaf) {
            $pendingState = Get-Content -LiteralPath $pointer -Raw | ConvertFrom-Json
            if ($pendingState.state -ne "VERIFIED_BACKUP_READY") {
                throw "Unsupported pending lifecycle state: $($pendingState.state)"
            }
            $pendingBackup = [IO.Path]::GetFullPath($pendingState.backupPath)
            $backupRootPath = [IO.Path]::GetFullPath((Join-Path $persistent "backups"))
            if (-not $pendingBackup.StartsWith($backupRootPath, [StringComparison]::OrdinalIgnoreCase) -or
                -not (Test-Path -LiteralPath (Join-Path $pendingBackup "backup-manifest.json") -PathType Leaf)) {
                throw "Pending lifecycle backup is invalid"
            }

            Stop-ControlledServices
            # The snapshot can contain service-owned files (notably
            # persistent\data\mqtt\mosquitto.db) whose explicit legacy DACL was
            # preserved when the backup was created. Normalize only this already
            # validated BIO-EMS backup tree before reading it for recovery.
            Grant-LifecycleTreeRestoreAccess $pendingBackup
            # Directory inheritance is insufficient for legacy Mosquitto files
            # with a protected explicit DACL. Reclaim the exact source and
            # destination persistence files before robocopy attempts replacement.
            Grant-LifecycleFileReadAccess (Join-Path $pendingBackup "persistent\data\mqtt\mosquitto.db")
            Grant-LifecycleFileReadAccess (Join-Path $persistent "data\mqtt\mosquitto.db")
            Invoke-Robocopy (Join-Path $pendingBackup "application") $application
            foreach ($name in @("config", "data", "licensing")) {
                $source = Join-Path $pendingBackup "persistent\$name"
                if (Test-Path -LiteralPath $source) { Invoke-Robocopy $source (Join-Path $persistent $name) }
            }

            $recoveryStartOrder = @($services)
            [array]::Reverse($recoveryStartOrder)
            foreach ($service in $recoveryStartOrder) { Start-Service -Name $service -ErrorAction Stop }

            $healthArgs = @{
                ApplicationRoot = $application
                PersistentRoot = $persistent
            }
            if ($PilotMode) { $healthArgs.PilotMode = $true }
            # Test-PostInstallHealth emits a terminating error on failure. Do not
            # inspect $LASTEXITCODE here: successful robocopy values 1-7 remain in
            # the session and would turn a PASS health result into a false failure.
            & (Join-Path $application "installer\Test-PostInstallHealth.ps1") @healthArgs

            $pendingState.state = "PREVIOUS_SNAPSHOT_RECOVERED"
            Write-Utf8 (Join-Path $persistent "logs\last-lifecycle.json") $pendingState
            Remove-Item -LiteralPath $pointer -Force
        }

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
        # Existing child files may carry protected explicit ACLs from older
        # releases, so granting only on the root is insufficient. Normalize the
        # existing snapshot tree to the same Administrators/SYSTEM access model
        # used by current BIO-EMS installations.
        foreach ($snapshotRootName in @("config", "data", "licensing")) {
            $snapshotRoot = Join-Path $persistent $snapshotRootName
            if (Test-Path -LiteralPath $snapshotRoot -PathType Container) {
                & icacls.exe $snapshotRoot /grant:r "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" /T /C /Q | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    throw "Unable to normalize legacy BIO-EMS snapshot ACLs for $snapshotRoot (icacls exit code $LASTEXITCODE)"
                }
            }
        }

        # Mosquitto persistence files created by legacy service-SID installs can
        # retain a protected owner/DACL that ignores parent grants. The broker is
        # fully stopped above, so take ownership of this BIO-EMS-owned persistence
        # file and grant SYSTEM/Administrators full access before snapshotting it.
        Grant-LifecycleFileReadAccess (Join-Path $persistent "data\mqtt\mosquitto.db")

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
        $healthArgs = @{
            ApplicationRoot = $application
            PersistentRoot = $persistent
        }
        if ($PilotMode) { $healthArgs.PilotMode = $true }
        # The health script uses terminating errors as its failure contract;
        # $LASTEXITCODE may still contain a successful non-zero robocopy result.
        & (Join-Path $application "installer\Test-PostInstallHealth.ps1") @healthArgs
        $state.state = "UPDATE_HEALTH_VERIFIED"
        Write-Utf8 (Join-Path $persistent "logs\last-lifecycle.json") $state
        Remove-Item -LiteralPath $pointer -Force
    } catch {
        Stop-ControlledServices
        Grant-LifecycleTreeRestoreAccess $backup
        Grant-LifecycleFileReadAccess (Join-Path $backup "persistent\data\mqtt\mosquitto.db")
        Grant-LifecycleFileReadAccess (Join-Path $persistent "data\mqtt\mosquitto.db")
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
