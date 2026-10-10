[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ApplicationRoot,
  [Parameter(Mandatory=$true)][string]$PersistentRoot,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$JobId
)
$ErrorActionPreference='Stop'
$jobs=Join-Path $PersistentRoot 'update-jobs'
$statusPath=Join-Path $jobs "$JobId.json"
$package=Join-Path $jobs "$JobId.exe"
$status=$null
function Save-Status([string]$state,[string]$errorText='') {
  $status.state=$state; $status.updatedAt=[DateTime]::UtcNow.ToString('o')
  $status | Add-Member -NotePropertyName error -NotePropertyValue $errorText -Force
  [IO.File]::WriteAllText("$statusPath.tmp",($status | ConvertTo-Json -Depth 8),(New-Object Text.UTF8Encoding($false)))
  Move-Item -LiteralPath "$statusPath.tmp" -Destination $statusPath -Force
}
try {
  $status=Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
  if ($status.jobId -ne $JobId -or $status.state -ne 'QUEUED') {throw 'Update job is not queued'}
  # Recheck the package after dispatch; never execute an upload based only on a prior check.
  $evidence=& (Join-Path $ApplicationRoot 'installer\Test-PlatformUpdatePackage.ps1') -PackagePath $package | ConvertFrom-Json
  if ($evidence.sha256 -ne $status.sha256 -or $evidence.publisher -ne $status.publisher -or $evidence.version -ne $status.version -or $evidence.sourceCommit -ne $status.sourceCommit) {throw 'Update evidence changed after upload'}
  $manifestPath=Join-Path $ApplicationRoot 'manifest\package-manifest.json'
  $before=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ([Version]$evidence.version -lt [Version]$before.productVersion) {throw 'Downgrade rejected'}
  $receiptPath=Join-Path $PersistentRoot 'licensing\installation-provisioning-receipt.json'
  $receiptBefore=Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
  $previousLifecyclePath=Join-Path $PersistentRoot 'logs\last-lifecycle.json'
  $previousBackup=''
  if (Test-Path -LiteralPath $previousLifecyclePath) {$previousBackup=(Get-Content -LiteralPath $previousLifecyclePath -Raw | ConvertFrom-Json).backupPath}
  Save-Status 'APPLYING' 
  $env:BIOEMS_CI_INSTALL_MODE='repair'
  $log=Join-Path $jobs "$JobId.install.log"
  $process=Start-Process -FilePath $package -ArgumentList @('/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART','/SP-',('/LOG="'+$log+'"')) -PassThru
  if (-not $process.WaitForExit(3600000)) {Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue; throw 'Update installer exceeded its one-hour timeout; inspect lifecycle logs'}
  $process.Refresh()
  if ($process.ExitCode -ne 0) {throw "Installer failed with exit code $($process.ExitCode); inspect lifecycle and installer logs"}
  & (Join-Path $ApplicationRoot 'installer\Test-PostInstallHealth.ps1') -ApplicationRoot $ApplicationRoot -PersistentRoot $PersistentRoot -PilotMode
  if (-not $?) {throw 'Post-update health failed'}
  $after=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  $receiptAfter=Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
  if (-not (Test-Path -LiteralPath $previousLifecyclePath)) {
    $failurePath=Join-Path $PersistentRoot 'logs\post-update-failure.json'
    if (Test-Path -LiteralPath $failurePath) {
      $failure=Get-Content -LiteralPath $failurePath -Raw | ConvertFrom-Json
      throw "Repair failed verification: $($failure.error)"
    }
    throw 'Repair did not produce successful lifecycle evidence; inspect installer log'
  }
  $lifecycle=Get-Content -LiteralPath $previousLifecyclePath -Raw | ConvertFrom-Json
  if ($lifecycle.state -ne 'UPDATE_HEALTH_VERIFIED' -or $lifecycle.backupPath -eq $previousBackup -or (Test-Path -LiteralPath (Join-Path $PersistentRoot 'logs\pending-lifecycle.json'))) {throw 'Repair lifecycle did not verify this update'}
  if ($after.sourceCommit -ne $status.sourceCommit -or $after.productVersion -ne $status.version -or $receiptAfter.installationId -ne $receiptBefore.installationId) {throw 'Installed version or installation identity verification failed'}
  Save-Status 'SUCCEEDED'
} catch {
  if ($status) {Save-Status 'FAILED' $_.Exception.Message}
} finally {
  Remove-Item -LiteralPath (Join-Path $jobs "$JobId.request.json") -Force -ErrorAction SilentlyContinue
  if ($status -and $status.state -in @('SUCCEEDED','FAILED')) {Remove-Item -LiteralPath $package -Force -ErrorAction SilentlyContinue}
  Unregister-ScheduledTask -TaskName "BIOEMS-Update-$JobId" -Confirm:$false -ErrorAction SilentlyContinue
}
