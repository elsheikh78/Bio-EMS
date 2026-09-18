[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InfluxCli,
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [Parameter(Mandatory = $true)][string]$HostUrl,
    [Parameter(Mandatory = $true)][string]$Org,
    [Parameter(Mandatory = $true)][string]$Token
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InfluxCli -PathType Leaf)) {
    throw "InfluxDB CLI is unavailable; platform backup cannot be sealed"
}

New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null

$env:INFLUX_HOST = $HostUrl
$env:INFLUX_ORG = $Org
$env:INFLUX_TOKEN = $Token
try {
    & $InfluxCli backup $BackupDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "InfluxDB backup failed with exit code $LASTEXITCODE"
    }
}
finally {
    Remove-Item Env:INFLUX_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:INFLUX_ORG -ErrorAction SilentlyContinue
    Remove-Item Env:INFLUX_TOKEN -ErrorAction SilentlyContinue
}

$files = @(Get-ChildItem -LiteralPath $BackupDirectory -File -Recurse)
if ($files.Count -eq 0) {
    throw "InfluxDB backup produced no artifacts"
}

Write-Host "DEP-BR InfluxDB backup: PASS"
