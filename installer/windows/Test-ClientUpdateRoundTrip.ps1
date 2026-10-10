[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$SetupPath)
$ErrorActionPreference='Stop'
$base='https://localhost/api/v1'
$application='C:\Program Files\BIO-EMS'
$persistent='C:\ProgramData\BIO-EMS'
$receipt=Join-Path $persistent 'licensing\installation-provisioning-receipt.json'
$identity=(Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json).installationId
$login=Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body (@{username='ci-admin';password='CiAdminPilot2026'} | ConvertTo-Json)
$headers=@{Authorization="Bearer $($login.access_token)"}
$cloudRejected=$false
try {Invoke-RestMethod -Uri "$base/platform-updates/internet" -Method Post -Headers $headers | Out-Null} catch {$cloudRejected=$_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 503}
if (-not $cloudRejected) {throw 'Cloud updater must remain disabled'}
$job=Invoke-RestMethod -Uri "$base/platform-updates/upload" -Method Post -Headers $headers -ContentType 'application/octet-stream' -InFile $SetupPath -TimeoutSec 180
if ($job.state -ne 'PREPARED' -or $job.sha256 -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $SetupPath).Hash.ToLowerInvariant()) {throw 'Update package did not pass verification'}
Invoke-RestMethod -Uri "$base/platform-updates/$($job.jobId)/apply" -Method Post -Headers $headers | Out-Null
$deadline=[DateTime]::UtcNow.AddMinutes(15)
$path=Join-Path $persistent "update-jobs\$($job.jobId).json"
do {
  Start-Sleep -Seconds 3
  try {$status=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json} catch {continue}
  if ($status.state -in @('SUCCEEDED','FAILED')) {break}
} while ([DateTime]::UtcNow -lt $deadline)
if ($status.state -ne 'SUCCEEDED') {
  Get-Content -LiteralPath (Join-Path $persistent 'logs\platform-restore-worker.log') -Tail 80 -ErrorAction SilentlyContinue
  Get-Content -LiteralPath (Join-Path $persistent "update-jobs\$($job.jobId).install.log") -Tail 120 -ErrorAction SilentlyContinue
  throw "Client update round trip failed state=$($status.state) error=$($status.error)"
}
if ((Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json).installationId -ne $identity) {throw 'Update changed installation identity'}
$health=Invoke-RestMethod -Uri "$base/health"
if ($health.status -ne 'UP') {throw 'Backend did not recover'}
$state=Invoke-RestMethod -Uri "$base/platform-updates" -Headers $headers
if ($state.latestJob.state -ne 'SUCCEEDED' -or $state.internetEnabled) {throw 'Client cannot see terminal update result'}
# Modifying the signed executable must fail verification before installation.
$bad=Join-Path $env:RUNNER_TEMP 'tampered-bioems-update.exe'
Copy-Item -LiteralPath $SetupPath -Destination $bad
$stream=[IO.File]::Open($bad,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite)
try {$stream.Position=4096; $value=$stream.ReadByte(); $stream.Position=4096; $stream.WriteByte(($value -bxor 1))} finally {$stream.Dispose()}
$rejected=$false
try {& (Join-Path $application 'installer\Test-PlatformUpdatePackage.ps1') -PackagePath $bad | Out-Null} catch {$rejected=$true}
Remove-Item -LiteralPath $bad -Force
if (-not $rejected) {throw 'Tampered package was accepted'}
Write-Host 'BIO-EMS client update upload/verify/dispatch/Repair/health/result/tamper: PASS'
