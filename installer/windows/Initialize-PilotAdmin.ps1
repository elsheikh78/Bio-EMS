[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot
)

$ErrorActionPreference = "Stop"
$logDirectory = Join-Path $PersistentRoot "logs"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logPath = Join-Path $logDirectory "admin-bootstrap.log"

function Write-Diagnostic([string]$message) {
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $message"
}

try {
    $username = $env:BIOEMS_BOOTSTRAP_ADMIN_USERNAME
    $password = $env:BIOEMS_BOOTSTRAP_ADMIN_PASSWORD
    $email = $env:BIOEMS_BOOTSTRAP_ADMIN_EMAIL
    if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrEmpty($password)) {
        throw "Administrator credentials were not supplied by the Setup wizard"
    }

    $nodes = @(Get-ChildItem -LiteralPath (Join-Path $ApplicationRoot "runtime\node") -Filter "node.exe" -File -Recurse)
    if ($nodes.Count -ne 1) { throw "Expected exactly one controlled Node.js executable" }
    $script = Join-Path $ApplicationRoot "backend\dist\src\scripts\bootstrap-admin.js"
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
        throw "Compiled administrator bootstrap script is missing"
    }

    $env:BIOEMS_SQLITE_PATH = Join-Path $PersistentRoot "data\bioems.db"
    Stop-Service -Name "BIOEMS-Backend" -Force -ErrorAction Stop
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
    Start-Service -Name "BIOEMS-Backend" -ErrorAction SilentlyContinue
}

Write-Host "BIO-EMS customer administrator initialization: PASS"
