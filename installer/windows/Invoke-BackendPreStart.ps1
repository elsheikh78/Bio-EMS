[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$NodeExecutable,
    [Parameter(Mandatory = $true)][string]$ProvisioningScript,
    [Parameter(Mandatory = $true)][string]$IdentityPath,
    [Parameter(Mandatory = $true)][string]$ReceiptPath,
    [Parameter(Mandatory = $true)][string]$DiagnosticLogPath,
    [Parameter(Mandatory = $true)][string]$BackendScript
)

$ErrorActionPreference = "Stop"
$diagnosticDirectory = Split-Path -Parent $DiagnosticLogPath
if ($diagnosticDirectory) {
    New-Item -ItemType Directory -Path $diagnosticDirectory -Force | Out-Null
}
"LIC-11 prestart entered at $([DateTimeOffset]::Now.ToString('o'))" | Out-File -FilePath $DiagnosticLogPath -Append -Encoding utf8
$identityExists = Test-Path -LiteralPath $IdentityPath -PathType Leaf
$receiptExists = Test-Path -LiteralPath $ReceiptPath -PathType Leaf

if ($identityExists -xor $receiptExists) {
    throw "Incomplete installation identity state; automatic replacement is prohibited"
}

if (-not $identityExists) {
    $env:BIOEMS_INSTALLATION_IDENTITY_PATH = $IdentityPath
    $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = $ReceiptPath
    & $NodeExecutable $ProvisioningScript 2>&1 | Tee-Object -FilePath $DiagnosticLogPath -Append
    if ($LASTEXITCODE -ne 0) {
        throw "LIC-11 installation identity provisioning failed under service identity; see $DiagnosticLogPath"
    }
}

if (-not (Test-Path -LiteralPath $IdentityPath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $ReceiptPath -PathType Leaf)) {
    throw "LIC-11 installation identity evidence is missing"
}

"LIC-11 provisioning evidence verified; starting Backend service process" | Out-File -FilePath $DiagnosticLogPath -Append -Encoding utf8
& $NodeExecutable $BackendScript
exit $LASTEXITCODE
