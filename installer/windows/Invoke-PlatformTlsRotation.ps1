[CmdletBinding(SupportsShouldProcess=$true,DefaultParameterSetName='Rotate')]
param(
    [Parameter(Mandatory=$true)][string]$ApplicationRoot,
    [Parameter(Mandatory=$true)][string]$PersistentRoot,
    [Parameter(Mandatory=$true)][string]$PlatformUrl,
    [Parameter(Mandatory=$true,ParameterSetName='Rotate')][string]$CandidatePfx,
    [Parameter(Mandatory=$true,ParameterSetName='Rotate')][Security.SecureString]$CandidatePassword,
    [Parameter(Mandatory=$true,ParameterSetName='Rotate')][string]$BackupParent,
    [Parameter(Mandatory=$true,ParameterSetName='Rollback')][string]$SnapshotDirectory,
    [string]$Node = 'node.exe'
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PlatformTlsOperations.psm1') -Force
if (-not $PSCmdlet.ShouldProcess($PlatformUrl,'Back up and rotate platform TLS; connected controllers require coordinated trust replacement')) { return }
if ($PSCmdlet.ParameterSetName -eq 'Rollback') {
    Restore-BioemsTlsSnapshot -ApplicationRoot $ApplicationRoot -PersistentRoot $PersistentRoot -PlatformUrl $PlatformUrl -SnapshotDirectory $SnapshotDirectory -Node $Node
    return
}
Invoke-BioemsTlsRotation -ApplicationRoot $ApplicationRoot -PersistentRoot $PersistentRoot -PlatformUrl $PlatformUrl -CandidatePfx $CandidatePfx -CandidatePassword $CandidatePassword -BackupParent $BackupParent -Node $Node
