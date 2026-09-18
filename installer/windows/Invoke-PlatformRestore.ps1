[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [Parameter(Mandatory = $true)][string]$InfluxCli,
    [Parameter(Mandatory = $true)][string]$HostUrl,
    [Parameter(Mandatory = $true)][string]$Org
)

$ErrorActionPreference = "Stop"
$application = [IO.Path]::GetFullPath($ApplicationRoot)
$persistent = [IO.Path]::GetFullPath($PersistentRoot)
$backup = [IO.Path]::GetFullPath($BackupDirectory)
$backupRoot = [IO.Path]::GetFullPath((Join-Path $persistent "backups"))
$services = @("BIOEMS-Backend", "BIOEMS-InfluxDB", "BIOEMS-MQTT")
$safety = Join-Path $backupRoot ("restore-safety-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ"))

function Assert-ChildPath([string]$parent, [string]$child, [string]$label) {
    $prefix = $parent.TrimEnd('\') + '\'
    if (-not $child.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "$label is outside the controlled BIO-EMS root"
    }
}
function Invoke-Robocopy([string]$source, [string]$destination) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    & robocopy.exe $source $destination /MIR /XJ /R:2 /W:1 /NFL /NDL /NP | Out-Null
    if ($LASTEXITCODE -gt 7) { throw "Controlled restore copy failed" }
}
function Start-ControlledServices {
    foreach ($service in @("BIOEMS-MQTT", "BIOEMS-InfluxDB", "BIOEMS-Backend")) {
        Start-Service -Name $service -ErrorAction Stop
    }
}
function Stop-ControlledServices {
    foreach ($service in $services) {
        Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
    }
}

Assert-ChildPath $backupRoot $backup "Backup directory"
if (-not (Test-Path -LiteralPath (Join-Path $backup "manifest.json") -PathType Leaf)) {
    throw "Validated sealed backup manifest is missing"
}
$sqliteSource = Join-Path $backup "bioems.sqlite"
$influxSource = Join-Path $backup "influxdb"
if (-not (Test-Path -LiteralPath $sqliteSource -PathType Leaf)) { throw "Validated SQLite artifact is missing" }
if (-not (Test-Path -LiteralPath $influxSource -PathType Container)) { throw "Validated InfluxDB artifact is missing" }
if (-not (Test-Path -LiteralPath $InfluxCli -PathType Leaf)) { throw "InfluxDB CLI is unavailable for restore" }
if (-not $env:INFLUX_TOKEN) { throw "INFLUX_TOKEN is unavailable to the controlled restore process" }

# Safety snapshot is always taken before destructive restore work.
New-Item -ItemType Directory -Path $safety -Force | Out-Null
$liveSqlite = Join-Path $persistent "data\bioems.db"
if (Test-Path -LiteralPath $liveSqlite -PathType Leaf) {
    Copy-Item -LiteralPath $liveSqlite -Destination (Join-Path $safety "bioems.db") -Force
}
$liveInflux = Join-Path $persistent "data\influxdb"
if (Test-Path -LiteralPath $liveInflux -PathType Container) {
    Invoke-Robocopy $liveInflux (Join-Path $safety "influxdb")
}

Stop-ControlledServices
try {
    Copy-Item -LiteralPath $sqliteSource -Destination $liveSqlite -Force

    # InfluxDB restore requires the database service to be available.
    Start-Service -Name "BIOEMS-InfluxDB" -ErrorAction Stop
    $env:INFLUX_HOST = $HostUrl
    $env:INFLUX_ORG = $Org
    & $InfluxCli restore $influxSource
    if ($LASTEXITCODE -ne 0) { throw "InfluxDB restore failed with exit code $LASTEXITCODE" }
    Stop-Service -Name "BIOEMS-InfluxDB" -Force -ErrorAction SilentlyContinue

    Start-ControlledServices
    & (Join-Path $application "installer\Test-PostInstallHealth.ps1") -ApplicationRoot $application -PersistentRoot $persistent
    if ($LASTEXITCODE -ne 0) { throw "Restored platform health verification failed" }
}
catch {
    $failure = $_
    Stop-ControlledServices
    if (Test-Path -LiteralPath (Join-Path $safety "bioems.db") -PathType Leaf) {
        Copy-Item -LiteralPath (Join-Path $safety "bioems.db") -Destination $liveSqlite -Force
    }
    if (Test-Path -LiteralPath (Join-Path $safety "influxdb") -PathType Container) {
        Invoke-Robocopy (Join-Path $safety "influxdb") $liveInflux
    }
    Start-ControlledServices
    throw "Platform restore failed; safety snapshot was restored. Cause: $($failure.Exception.Message)"
}
finally {
    Remove-Item Env:INFLUX_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:INFLUX_ORG -ErrorAction SilentlyContinue
}

Write-Host "DEP-BR controlled platform restore: PASS"
