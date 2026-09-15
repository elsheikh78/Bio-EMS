[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [Parameter(Mandatory = $true)][string]$CredentialFile
)

$ErrorActionPreference = "Stop"
$logDirectory = Join-Path $PersistentRoot "logs"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logPath = Join-Path $logDirectory "admin-bootstrap.log"
$dataDirectory = Join-Path $PersistentRoot "data"
$bootstrapPrincipal = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$originalDataAcl = $null

function Write-Diagnostic([string]$message) {
    try {
        Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $message" -ErrorAction Stop
    } catch {
        Write-Verbose "Administrator bootstrap diagnostic log is not writable in the current host context"
    }
}

try {
    if (-not (Test-Path -LiteralPath $CredentialFile -PathType Leaf)) {
        throw "Administrator credential handoff is missing"
    }
    $credentialLines = @([IO.File]::ReadAllLines($CredentialFile, [Text.Encoding]::Unicode))
    Remove-Item -LiteralPath $CredentialFile -Force
    if ($credentialLines.Count -ne 3) {
        throw "Administrator credential handoff is invalid"
    }
    $username = $credentialLines[0]
    $email = $credentialLines[1]
    $password = $credentialLines[2]
    if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrEmpty($password)) {
        throw "Administrator credentials were not supplied by the Setup wizard"
    }
    $env:BIOEMS_BOOTSTRAP_ADMIN_USERNAME = $username
    $env:BIOEMS_BOOTSTRAP_ADMIN_PASSWORD = $password
    $env:BIOEMS_BOOTSTRAP_ADMIN_EMAIL = $email

    $nodes = @(Get-ChildItem -LiteralPath (Join-Path $ApplicationRoot "runtime\node") -Filter "node.exe" -File -Recurse)
    if ($nodes.Count -ne 1) { throw "Expected exactly one controlled Node.js executable" }
    $script = Join-Path $ApplicationRoot "backend\dist\src\scripts\bootstrap-admin.js"
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
        throw "Compiled administrator bootstrap script is missing"
    }

    $env:BIOEMS_SQLITE_PATH = Join-Path $PersistentRoot "data\bioems.db"
    Stop-Service -Name "BIOEMS-Backend" -Force -ErrorAction Stop
    $originalDataAcl = Get-Acl -LiteralPath $dataDirectory -ErrorAction Stop
    & icacls.exe $dataDirectory /grant "$bootstrapPrincipal`:(OI)(CI)M" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Temporary administrator database access could not be granted"
    }
    Write-Diagnostic "starting one-time customer administrator bootstrap"
    & $nodes[0].FullName $script
    if ($LASTEXITCODE -ne 0) {
        throw "Administrator bootstrap command failed with exit code $LASTEXITCODE"
    }
    Write-Diagnostic "customer administrator bootstrap completed"
}
catch {
    Write-Diagnostic "FATAL: $($_.Exception.Message)"
    Write-Error ("BIO-EMS administrator initialization failed: " + $_.Exception.Message)
    exit 1
}
finally {
    Remove-Item Env:BIOEMS_BOOTSTRAP_ADMIN_USERNAME -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_ADMIN_EMAIL -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_SQLITE_PATH -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $CredentialFile -Force -ErrorAction SilentlyContinue
    if ($null -ne $originalDataAcl) {
        Set-Acl -LiteralPath $dataDirectory -AclObject $originalDataAcl -ErrorAction SilentlyContinue
    }
    Start-Service -Name "BIOEMS-Backend" -ErrorAction SilentlyContinue
}

Write-Host "BIO-EMS customer administrator initialization: PASS"
