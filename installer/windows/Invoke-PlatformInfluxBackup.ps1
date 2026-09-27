[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InfluxCli,
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [Parameter(Mandatory = $true)][string]$HostUrl,
    [Parameter(Mandatory = $true)][string]$Org,
    [ValidateRange(1, 10)][int]$MaxAttempts = 5,
    [ValidateRange(1, 30)][int]$RetryDelaySeconds = 3
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
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            $backupSucceeded = $true
            break
        }

        if ($attempt -lt $MaxAttempts) {
            $retryDelay = [Math]::Min(30, $RetryDelaySeconds * $attempt)
            $healthState = "unknown"
            try {
                $health = Invoke-RestMethod -Uri "$HostUrl/health" -TimeoutSec 10
                if ($health -and $health.status) { $healthState = [string]$health.status }
            } catch {
                $healthState = "unavailable"
            }
            Write-Warning "InfluxDB backup attempt $attempt/$MaxAttempts failed with exit code $exitCode (health=$healthState); retrying after $retryDelay second(s)."
            Start-Sleep -Seconds $retryDelay
        }
    }
    if (-not $backupSucceeded) {
        throw "InfluxDB backup failed after $MaxAttempts attempt(s); last exit code $exitCode"
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
