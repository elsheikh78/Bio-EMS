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

function Write-Diagnostic([string]$Message) {
    $timestamp = [DateTimeOffset]::Now.ToString("o")
    "$timestamp $Message" | Out-File -FilePath $DiagnosticLogPath -Append -Encoding utf8
}

try {
    $diagnosticDirectory = Split-Path -Parent $DiagnosticLogPath
    if ($diagnosticDirectory) {
        New-Item -ItemType Directory -Path $diagnosticDirectory -Force | Out-Null
    }

    Write-Diagnostic "LIC-11 launcher entered"
    Write-Diagnostic "service identity=$([Security.Principal.WindowsIdentity]::GetCurrent().Name)"

    foreach ($requiredFile in @($NodeExecutable, $ProvisioningScript, $BackendScript)) {
        if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
            throw "Required launcher file is missing: $requiredFile"
        }
    }
    Write-Diagnostic "required executable/script files verified"

    $identityDirectory = Split-Path -Parent $IdentityPath
    $receiptDirectory = Split-Path -Parent $ReceiptPath
    foreach ($requiredDirectory in @($identityDirectory, $receiptDirectory)) {
        if (-not (Test-Path -LiteralPath $requiredDirectory -PathType Container)) {
            throw "Required licensing directory is missing: $requiredDirectory"
        }
    }
    Write-Diagnostic "licensing directories verified"

    $identityExists = Test-Path -LiteralPath $IdentityPath -PathType Leaf
    $receiptExists = Test-Path -LiteralPath $ReceiptPath -PathType Leaf
    Write-Diagnostic "identityExists=$identityExists receiptExists=$receiptExists"

    if ($identityExists -xor $receiptExists) {
        throw "Incomplete installation identity state; automatic replacement is prohibited"
    }

    if (-not $identityExists) {
        $env:BIOEMS_INSTALLATION_IDENTITY_PATH = $IdentityPath
        $env:BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = $ReceiptPath
        Write-Diagnostic "starting installation identity provisioner"
        $provisionOutput = & $NodeExecutable $ProvisioningScript 2>&1
        $provisionExitCode = $LASTEXITCODE
        foreach ($line in @($provisionOutput)) {
            Write-Diagnostic "provisioner: $line"
        }
        Write-Diagnostic "installation identity provisioner exitCode=$provisionExitCode"
        if ($provisionExitCode -ne 0) {
            throw "LIC-11 installation identity provisioning failed under service identity"
        }
    }

    if (-not (Test-Path -LiteralPath $IdentityPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $ReceiptPath -PathType Leaf)) {
        throw "LIC-11 installation identity evidence is missing"
    }

    Write-Diagnostic "LIC-11 provisioning evidence verified; starting Backend service process"
    & $NodeExecutable $BackendScript
    $backendExitCode = $LASTEXITCODE
    Write-Diagnostic "Backend service process exited with code $backendExitCode"
    exit $backendExitCode
}
catch {
    try {
        Write-Diagnostic "FATAL: $($_.Exception.GetType().FullName): $($_.Exception.Message)"
        if ($_.ScriptStackTrace) {
            Write-Diagnostic "STACK: $($_.ScriptStackTrace -replace '[\r\n]+', ' | ')"
        }
    }
    catch {
        # Do not mask the original launcher failure if diagnostic persistence itself fails.
    }
    exit 1
}
