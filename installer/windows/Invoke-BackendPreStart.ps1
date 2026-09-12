[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$NodeExecutable,
    [Parameter(Mandatory = $true)][string]$ProvisioningScript,
    [Parameter(Mandatory = $true)][string]$IdentityPath,
    [Parameter(Mandatory = $true)][string]$ReceiptPath,
    [Parameter(Mandatory = $true)][string]$DiagnosticLogPath
)

$ErrorActionPreference = "Stop"
$identityExists = Test-Path -LiteralPath $IdentityPath -PathType Leaf
$receiptExists = Test-Path -LiteralPath $ReceiptPath -PathType Leaf

if ($identityExists -xor $receiptExists) {
    throw "Incomplete installation identity state; automatic replacement is prohibited"
}

if (-not $identityExists) {
    $env:BIOEMS_INSTALLATION_IDENTITY_PATH = $IdentityPath
    $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = $ReceiptPath
    $diagnosticDirectory = Split-Path -Parent $DiagnosticLogPath
    if ($diagnosticDirectory) {
        New-Item -ItemType Directory -Path $diagnosticDirectory -Force | Out-Null
    }
    & $NodeExecutable $ProvisioningScript 2>&1 | Tee-Object -FilePath $DiagnosticLogPath -Append
    if ($LASTEXITCODE -ne 0) {
        throw "LIC-11 installation identity provisioning failed under service identity; see $DiagnosticLogPath"
    }
}

if (-not (Test-Path -LiteralPath $IdentityPath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $ReceiptPath -PathType Leaf)) {
    throw "LIC-11 installation identity evidence is missing"
}
