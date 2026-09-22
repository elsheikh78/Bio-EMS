[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot
)

$ErrorActionPreference = "Continue"
$application = [IO.Path]::GetFullPath($ApplicationRoot)
$persistent = [IO.Path]::GetFullPath($PersistentRoot)
$jobs = Join-Path $persistent "restore-jobs"
$log = Join-Path $persistent "logs\platform-restore-worker.log"

function Write-WorkerLog([string]$message) {
    "$(Get-Date -Format o) $message" | Out-File -LiteralPath $log -Append -Encoding utf8
}

function Read-BackendEnvironment {
    $values = @{}
    $path = Join-Path $persistent "config\backend.env"
    foreach ($line in @(Get-Content -LiteralPath $path -ErrorAction Stop)) {
        if ($line -match '^([^#=]+)=(.*)$') { $values[$matches[1].Trim()] = $matches[2] }
    }
    return $values
}

New-Item -ItemType Directory -Path $jobs -Force | Out-Null
Write-WorkerLog "restore coordinator started"
while ($true) {
    # A legacy backend could persist QUEUED status without a dispatch request.
    # Close those jobs explicitly so operators are never left with a permanent
    # spinner and an ambiguous restore outcome.
    foreach ($statusFile in @(Get-ChildItem -LiteralPath $jobs -Filter "*.json" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.request.json" })) {
        try {
            $stale = Get-Content -LiteralPath $statusFile.FullName -Raw | ConvertFrom-Json
            $requestPath = Join-Path $jobs "$($stale.jobId).request.json"
            $updatedAt = [DateTime]::Parse($stale.updatedAt).ToUniversalTime()
            if ($stale.state -eq "QUEUED" -and -not (Test-Path -LiteralPath $requestPath -PathType Leaf) -and $updatedAt -lt [DateTime]::UtcNow.AddMinutes(-5)) {
                $stale.state = "FAILED"
                $stale.updatedAt = [DateTime]::UtcNow.ToString("o")
                $stale | Add-Member -NotePropertyName error -NotePropertyValue "Restore request is missing or expired; no data was changed" -Force
                $temporary = "$($statusFile.FullName).tmp"
                $stale | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporary -Encoding UTF8
                Move-Item -LiteralPath $temporary -Destination $statusFile.FullName -Force
                Write-WorkerLog "expired orphaned restore job=$($stale.jobId)"
            }
        }
        catch { Write-WorkerLog "failed to reconcile restore status file=$($statusFile.Name) error=$($_.Exception.Message)" }
    }
    foreach ($requestFile in @(Get-ChildItem -LiteralPath $jobs -Filter "*.request.json" -File -ErrorAction SilentlyContinue | Sort-Object CreationTimeUtc)) {
        $statusPath = $null
        try {
            $jobId = $requestFile.Name.Substring(0, $requestFile.Name.Length - ".request.json".Length)
            $statusPath = Join-Path $jobs "$jobId.json"
            if (-not (Test-Path -LiteralPath $statusPath -PathType Leaf)) { throw "Restore status file is missing" }
            $status = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
            if ($status.state -ne "QUEUED") {
                if ($status.state -in @("SUCCEEDED", "FAILED")) { Remove-Item -LiteralPath $requestFile.FullName -Force }
                continue
            }
            $request = Get-Content -LiteralPath $requestFile.FullName -Raw | ConvertFrom-Json
            $environment = Read-BackendEnvironment
            if (-not $environment.INFLUX_TOKEN) { throw "INFLUX_TOKEN is unavailable to restore coordinator" }
            if (-not $environment.INFLUX_BUCKET) { throw "INFLUX_BUCKET is unavailable to restore coordinator" }
            $env:INFLUX_TOKEN = $environment.INFLUX_TOKEN
            $env:INFLUX_BUCKET = $environment.INFLUX_BUCKET
            Write-WorkerLog "starting restore job=$jobId"
            & (Join-Path $application "installer\Invoke-PlatformRestore.ps1") `
                -ApplicationRoot $application `
                -PersistentRoot $persistent `
                -BackupDirectory $request.backupDirectory `
                -SafetyDirectory $request.safetyDirectory `
                -InfluxCli $request.influxCli `
                -HostUrl $request.hostUrl `
                -Org $request.org `
                -JobStatusPath $statusPath
            Write-WorkerLog "restore job=$jobId exitCode=$LASTEXITCODE"
            $terminal = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
            if ($terminal.state -in @("SUCCEEDED", "FAILED")) { Remove-Item -LiteralPath $requestFile.FullName -Force }
        }
        catch {
            Write-WorkerLog "restore dispatch failed file=$($requestFile.Name) error=$($_.Exception.Message)"
            try {
                if ($statusPath -and (Test-Path -LiteralPath $statusPath -PathType Leaf)) {
                    $failed = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
                    if ($failed.state -eq "QUEUED") {
                        $failed.state = "FAILED"
                        $failed.updatedAt = [DateTime]::UtcNow.ToString("o")
                        $failed | Add-Member -NotePropertyName error -NotePropertyValue $_.Exception.Message -Force
                        $temporary = "$statusPath.tmp"
                        $failed | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporary -Encoding UTF8
                        Move-Item -LiteralPath $temporary -Destination $statusPath -Force
                    }
                }
            }
            catch { Write-WorkerLog "failed to persist dispatch failure file=$($requestFile.Name)" }
        }
        finally {
            Remove-Item Env:INFLUX_TOKEN -ErrorAction SilentlyContinue
            Remove-Item Env:INFLUX_BUCKET -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}
