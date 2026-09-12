[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet("PreUpdate", "PostUpdate", "Uninstall")][string]$Mode,
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
    & robocopy.exe $source $destination /MIR /XJ /R:2 /W:1 /NFL /NDL /NP | Out-Null
    if ($LASTEXITCODE -gt 7) { throw "Controlled lifecycle copy failed" }
}
function Stop-ControlledServices {
    foreach ($service in $services) { Stop-Service -Name $service -Force -ErrorAction SilentlyContinue }
}
function Write-Utf8([string]$path, [object]$value) {
    [IO.File]::WriteAllText($path, ($value | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))
}
function Get-Manifest([string]$root) {
    return @(Get-ChildItem -LiteralPath $root -File -Recurse | Sort-Object FullName | ForEach-Object {
        [ordered]@{ relativePath = $_.FullName.Substring($root.Length).TrimStart('\'); sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    })
}

if ($Mode -eq "PreUpdate") {
    if (Test-Path -LiteralPath $pointer) { throw "A lifecycle operation is already pending" }
    Stop-ControlledServices
    $backup = Join-Path $persistent ("backups\lifecycle-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ"))
    Invoke-Robocopy $application (Join-Path $backup "application")
    foreach ($name in @("config", "data", "licensing")) {
        $source = Join-Path $persistent $name
        if (Test-Path -LiteralPath $source) { Invoke-Robocopy $source (Join-Path $backup "persistent\$name") }
    }
    $manifest = [ordered]@{ schemaVersion = 1; createdAt = (Get-Date).ToUniversalTime().ToString("o"); application = Get-Manifest (Join-Path $backup "application"); persistent = Get-Manifest (Join-Path $backup "persistent") }
    Write-Utf8 (Join-Path $backup "backup-manifest.json") $manifest
    Write-Utf8 $pointer ([ordered]@{ schemaVersion = 1; backupPath = $backup; state = "VERIFIED_BACKUP_READY" })
    Write-Host "DEP-01-05 verified pre-update backup: PASS"
    exit 0
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
    $thumbprint = (Get-Content -LiteralPath $certificateEvidence -Raw | ConvertFrom-Json).thumbprint
    foreach ($store in @("Cert:\LocalMachine\My", "Cert:\LocalMachine\Root")) {
        Get-ChildItem $store | Where-Object Thumbprint -eq $thumbprint | Remove-Item -Force
    }
}
$evidence = [ordered]@{ schemaVersion = 1; state = "APPLICATION_REMOVED_DATA_RETAINED"; retainedRoot = $persistent; completedAt = (Get-Date).ToUniversalTime().ToString("o") }
Write-Utf8 (Join-Path $persistent "logs\uninstall-retention.json") $evidence
Write-Host "BIO-EMS application removed; customer data and licensing identity retained"
