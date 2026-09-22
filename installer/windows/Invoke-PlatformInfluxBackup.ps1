[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InfluxCli,
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [Parameter(Mandatory = $true)][string]$HostUrl,
    [Parameter(Mandatory = $true)][string]$Org,
    [ValidateRange(1, 5)][int]$MaxAttempts = 3,
    [ValidateRange(1, 30)][int]$RetryDelaySeconds = 2
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
    $backupSucceeded = $false
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        if (Test-Path -LiteralPath $BackupDirectory) {
            Get-ChildItem -LiteralPath $BackupDirectory -Force -ErrorAction SilentlyContinue |
                Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
        & $InfluxCli backup $BackupDirectory
        if ($LASTEXITCODE -eq 0) {
            $backupSucceeded = $true
            break
        }
        if ($attempt -lt $MaxAttempts) {
            Write-Warning "InfluxDB backup attempt $attempt/$MaxAttempts failed with exit code $LASTEXITCODE; retrying after $RetryDelaySeconds second(s)."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
    if (-not $backupSucceeded) {
        throw "InfluxDB backup failed after $MaxAttempts attempt(s)"
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
