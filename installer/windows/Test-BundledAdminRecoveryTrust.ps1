[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$StagingDirectory,
    [string]$PersistentRoot = 'C:\ProgramData\BIO-EMS'
)
$ErrorActionPreference = 'Stop'
$source = Join-Path $StagingDirectory 'payload\manufacturer-admin-recovery-trust.json'
$installed = Join-Path $PersistentRoot 'licensing\manufacturer-admin-recovery-trust.json'
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    Write-Host 'Company recovery public trust was not configured for this build; field recovery readiness is not claimed.'
    return
}
if (-not (Test-Path -LiteralPath $installed -PathType Leaf)) { throw 'Bundled recovery public trust was not installed automatically' }
if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $installed -Algorithm SHA256).Hash) {
    throw 'Installed recovery public trust differs from signed Setup payload'
}
Write-Host 'Automatic company recovery public trust deployment: PASS'
