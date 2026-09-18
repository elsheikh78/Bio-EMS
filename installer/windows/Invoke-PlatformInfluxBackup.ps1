[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InfluxCli,
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [Parameter(Mandatory = $true)][string]$HostUrl,
    [Parameter(Mandatory = $true)][string]$Org
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InfluxCli -PathType Leaf)) {
    throw "InfluxDB CLI is unavailable; platform backup cannot be sealed"
}
if (-not $env:INFLUX_TOKEN) {
    throw "INFLUX_TOKEN is unavailable to the controlled backup process"
}

New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null

$previousHost = $env:INFLUX_HOST
$previousOrg = $env:INFLUX_ORG
try {
    $env:INFLUX_HOST = $HostUrl
    $env:INFLUX_ORG = $Org
    & $InfluxCli backup $BackupDirectory
    if ($LASTEXITCODE -ne 0) {
        throw "InfluxDB backup failed with exit code $LASTEXITCODE"
    }
}
finally {
    $env:INFLUX_HOST = $previousHost
    $env:INFLUX_ORG = $previousOrg
}

$files = @(Get-ChildItem -LiteralPath $BackupDirectory -File -Recurse)
if ($files.Count -eq 0) {
    throw "InfluxDB backup produced no artifacts"
}

Write-Host "DEP-BR InfluxDB backup: PASS"
