[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$SetupPath)
$ErrorActionPreference='Stop'
$base='https://localhost/api/v1'
$application='C:\Program Files\BIO-EMS'
$persistent='C:\ProgramData\BIO-EMS'
$receipt=Join-Path $persistent 'licensing\installation-provisioning-receipt.json'
$identity=(Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json).installationId
$environmentPath=Join-Path $persistent 'config\backend.env'
$tokenBefore=@(Get-Content -LiteralPath $environmentPath | Where-Object { $_.StartsWith('BIOEMS_PROVISIONER_TOKEN=') })
if ($tokenBefore.Count -ne 1) {throw 'Expected one existing Provisioner secret'}
$login=Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body (@{username='ci-admin';password='CiAdminPilot2026'} | ConvertTo-Json)
$headers=@{Authorization="Bearer $($login.access_token)"}
$installed=Invoke-RestMethod -Uri "$base/platform-updates" -Headers $headers
$manifest=Get-Content -LiteralPath (Join-Path $application 'manifest\package-manifest.json') -Raw | ConvertFrom-Json
if ($installed.installedVersion -ne $manifest.productVersion -or $installed.sourceCommit -ne $manifest.sourceCommit) {throw 'Installed update status does not match the package manifest'}
$cloudRejected=$false
try {Invoke-RestMethod -Uri "$base/platform-updates/internet" -Method Post -Headers $headers | Out-Null} catch {$cloudRejected=$_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 503}
if (-not $cloudRejected) {throw 'Cloud updater must remain disabled'}
# Stream the installer instead of buffering a large EXE in Windows PowerShell's
# Invoke-RestMethod. Keep a bounded timeout for upload plus signature validation.
Add-Type -AssemblyName System.Net.Http
$http=New-Object System.Net.Http.HttpClient
$http.Timeout=[TimeSpan]::FromMinutes(10)
$http.DefaultRequestHeaders.Authorization=New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer',$login.access_token)
$inputStream=[IO.File]::OpenRead($SetupPath)
$content=New-Object System.Net.Http.StreamContent($inputStream)
$content.Headers.ContentType=New-Object System.Net.Http.Headers.MediaTypeHeaderValue('application/octet-stream')
$content.Headers.ContentLength=$inputStream.Length
Write-Host "Uploading signed client Setup ($($inputStream.Length) bytes)"
try {
  $response=$http.PostAsync("$base/platform-updates/upload",$content).GetAwaiter().GetResult()
  $responseText=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (-not $response.IsSuccessStatusCode) {throw "Update upload HTTP $([int]$response.StatusCode): $responseText"}
  $job=$responseText | ConvertFrom-Json
} catch {
  Get-ChildItem -LiteralPath (Join-Path $persistent 'update-jobs') -Filter '*.json' -ErrorAction SilentlyContinue | ForEach-Object {Get-Content -LiteralPath $_.FullName -Raw}
  Get-ChildItem -LiteralPath (Join-Path $persistent 'update-jobs') -Filter '*.exe' -ErrorAction SilentlyContinue | Select-Object Name,Length | Format-Table
  Get-Service BIOEMS-Backend -ErrorAction SilentlyContinue | Format-Table Name,Status
  throw
} finally {$content.Dispose();$inputStream.Dispose();$http.Dispose()}
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
  foreach ($diagnostic in @('post-update-failure.json','pending-lifecycle.json','last-lifecycle.json','post-install-health.json')) {
    Get-Content -LiteralPath (Join-Path $persistent "logs\$diagnostic") -Raw -ErrorAction SilentlyContinue
  }
  Get-Content -LiteralPath (Join-Path $persistent 'logs\platform-restore-worker.log') -Tail 80 -ErrorAction SilentlyContinue
  Get-Content -LiteralPath (Join-Path $persistent "update-jobs\$($job.jobId).install.log") -Tail 120 -ErrorAction SilentlyContinue
  throw "Client update round trip failed state=$($status.state) error=$($status.error)"
}
if ((Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json).installationId -ne $identity) {throw 'Update changed installation identity'}
$tokenAfter=@(Get-Content -LiteralPath $environmentPath | Where-Object { $_.StartsWith('BIOEMS_PROVISIONER_TOKEN=') })
if ($tokenAfter.Count -ne 1 -or $tokenAfter[0] -cne $tokenBefore[0]) {throw 'Repair changed the existing Provisioner secret'}
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
