#Requires -Version 5.1
#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$TrustFile,
    [string]$ApplicationRoot = (Join-Path $env:ProgramFiles 'BIO-EMS'),
    [string]$PersistentRoot = (Join-Path $env:ProgramData 'BIO-EMS')
)
$ErrorActionPreference = 'Stop'
$licensing = Join-Path $PersistentRoot 'licensing'
if (-not (Test-Path -LiteralPath (Join-Path $licensing 'installation-provisioning-receipt.json'))) { throw 'Installed identity receipt is missing' }
$node = Join-Path $ApplicationRoot 'runtime\node\node.exe'
$script = Join-Path $ApplicationRoot 'backend\dist\src\scripts\install-admin-recovery-trust.js'
$oldSource = $env:BIOEMS_ADMIN_RECOVERY_TRUST_SOURCE
$oldReceipt = $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH
try {
    $env:BIOEMS_ADMIN_RECOVERY_TRUST_SOURCE = [IO.Path]::GetFullPath($TrustFile)
    $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = Join-Path $licensing 'installation-provisioning-receipt.json'
    & $node $script
    if ($LASTEXITCODE -ne 0) { throw 'Public recovery trust was rejected' }
    # The licensing directory's protected ACL is retained; never grant ordinary users write access.
    $path = Join-Path $licensing 'manufacturer-admin-recovery-trust.json'
    & icacls.exe $path /reset | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not inherit protected licensing ACL' }
} finally {
    $env:BIOEMS_ADMIN_RECOVERY_TRUST_SOURCE = $oldSource
    $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = $oldReceipt
}
