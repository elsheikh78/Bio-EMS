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

function Write-JsonUtf8NoBom([object]$value, [string]$path) {
    $json = $value | ConvertTo-Json -Depth 8
    [IO.File]::WriteAllText($path, "$json`r`n", (New-Object Text.UTF8Encoding($false)))
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
    # Dispatch updates as one-shot SYSTEM tasks: they survive service shutdown during Repair.
    $updateJobs = Join-Path $persistent "update-jobs"
    foreach ($updateFile in @(Get-ChildItem -LiteralPath $updateJobs -Filter "*.json" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.request.json" })) {
        try {
            $record = Get-Content -LiteralPath $updateFile.FullName -Raw | ConvertFrom-Json
            $elapsed = ([DateTime]::UtcNow - [DateTime]::Parse($record.updatedAt).ToUniversalTime()).TotalMinutes
            $interrupted = $false
            if ($record.state -eq "UPLOADING" -and $elapsed -gt 10) {
                $interrupted = $true
                Remove-Item -LiteralPath (Join-Path $updateJobs "upload.lock") -Recurse -Force -ErrorAction SilentlyContinue
            }
            if ($record.state -eq "APPLYING") {
                $task = Get-ScheduledTask -TaskName "BIOEMS-Update-$($record.jobId)" -ErrorAction SilentlyContinue
                if ($elapsed -gt 5 -and (-not $task -or $task.State -ne "Running")) { $interrupted = $true }
            }
            if ($interrupted) {
                $record.state = "FAILED"
                $record.updatedAt = [DateTime]::UtcNow.ToString("o")
                $record | Add-Member -NotePropertyName error -NotePropertyValue "Update was interrupted; inspect lifecycle logs and run Repair if services did not recover" -Force
                Write-JsonUtf8NoBom $record "$($updateFile.FullName).tmp"
                Move-Item -LiteralPath "$($updateFile.FullName).tmp" -Destination $updateFile.FullName -Force
                Remove-Item -LiteralPath (Join-Path $updateJobs "$($record.jobId).request.json") -Force -ErrorAction SilentlyContinue
            }
        } catch { Write-WorkerLog "update reconciliation failed file=$($updateFile.Name)" }
    }
    $activeRestore = @(Get-ChildItem -LiteralPath $jobs -Filter "*.json" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.request.json" } | ForEach-Object {
        try { $job = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json; if ($job.state -notin @("SUCCEEDED", "FAILED")) { $job } } catch { }
    })
    $updateDispatched = $false
    if ($activeRestore.Count -eq 0) {
        foreach ($updateRequest in @(Get-ChildItem -LiteralPath $updateJobs -Filter "*.request.json" -File -ErrorAction SilentlyContinue)) {
            $updateId = $updateRequest.Name.Replace(".request.json", "")
            if ($updateId -notmatch '^[a-f0-9-]{36}$') { continue }
            try {
                $updateStatus = Get-Content -LiteralPath (Join-Path $updateJobs "$updateId.json") -Raw | ConvertFrom-Json
                if ($updateStatus.state -ne "QUEUED") { continue }
                $taskName = "BIOEMS-Update-$updateId"
                if (-not (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)) {
                    $updateScript = Join-Path $application "installer\Invoke-PlatformUpdate.ps1"
                    $args = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$updateScript`" -ApplicationRoot `"$application`" -PersistentRoot `"$persistent`" -JobId $updateId"
                    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $args
                    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
                    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 2)
                    Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings -Force | Out-Null
                    Start-ScheduledTask -TaskName $taskName
                    $updateDispatched = $true
                    Write-WorkerLog "dispatched update job=$updateId"
                }
            } catch {
                Write-WorkerLog "update dispatch failed job=$updateId error=$($_.Exception.Message)"
                try {
                    $updateStatus.state = "FAILED"
                    $updateStatus.updatedAt = [DateTime]::UtcNow.ToString("o")
                    $updateStatus | Add-Member -NotePropertyName error -NotePropertyValue $_.Exception.Message -Force
                    Write-JsonUtf8NoBom $updateStatus (Join-Path $updateJobs "$updateId.json.tmp")
                    Move-Item -LiteralPath (Join-Path $updateJobs "$updateId.json.tmp") -Destination (Join-Path $updateJobs "$updateId.json") -Force
                    Remove-Item -LiteralPath $updateRequest.FullName -Force
                } catch { Write-WorkerLog "could not persist failed update job=$updateId" }
            }
        }
    }
    $activeUpdate = @(Get-ChildItem -LiteralPath $updateJobs -Filter "*.json" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*.request.json" } | ForEach-Object {
        try { $job = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json; if ($job.state -eq "APPLYING") { $job } } catch { }
    })
    if ($updateDispatched -or $activeUpdate.Count -gt 0) { Start-Sleep -Seconds 2; continue }
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
                Write-JsonUtf8NoBom $stale $temporary
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
                        Write-JsonUtf8NoBom $failed $temporary
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
