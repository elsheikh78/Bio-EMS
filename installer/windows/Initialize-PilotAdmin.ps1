[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [Parameter(Mandatory = $true)][string]$CredentialFile,
    [Parameter(Mandatory = $true)][string]$CustomerName,
    [Parameter(Mandatory = $true)][string]$CustomerCode,
    [Parameter(Mandatory = $true)][string]$SiteName,
    [Parameter(Mandatory = $true)][string]$SiteCode,
    [string]$SiteLocation = ""
)

$ErrorActionPreference = "Stop"
$logDirectory = Join-Path $PersistentRoot "logs"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$logPath = Join-Path $logDirectory "admin-bootstrap.log"
New-Item -ItemType File -Path $logPath -Force | Out-Null
$installerPrincipal = "$env:USERDOMAIN\$env:USERNAME"
& icacls.exe $logPath /grant:r "$installerPrincipal`:R" | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Administrator bootstrap diagnostic access could not be prepared"
}

function Write-Diagnostic([string]$message) {
    Write-Host "BIO-EMS admin bootstrap: $message"
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
    $credentialLines = @([IO.File]::ReadAllLines($CredentialFile, [Text.Encoding]::UTF8))
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
    $env:BIOEMS_BOOTSTRAP_CUSTOMER_NAME = $CustomerName
    $env:BIOEMS_BOOTSTRAP_CUSTOMER_CODE = $CustomerCode
    $env:BIOEMS_BOOTSTRAP_SITE_NAME = $SiteName
    $env:BIOEMS_BOOTSTRAP_SITE_CODE = $SiteCode
    $env:BIOEMS_BOOTSTRAP_SITE_LOCATION = $SiteLocation

    $nodes = @(Get-ChildItem -LiteralPath (Join-Path $ApplicationRoot "runtime\node") -Filter "node.exe" -File -Recurse)
    if ($nodes.Count -ne 1) { throw "Expected exactly one controlled Node.js executable" }
    $script = Join-Path $ApplicationRoot "backend\dist\src\scripts\bootstrap-admin.js"
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
        throw "Compiled administrator bootstrap script is missing"
    }

    $env:BIOEMS_SQLITE_PATH = Join-Path $PersistentRoot "data\bioems.db"
    Stop-Service -Name "BIOEMS-Backend" -Force -ErrorAction Stop
    $dataDirectory = Join-Path $PersistentRoot "data"
    & icacls.exe $dataDirectory /grant:r "BUILTIN\Administrators:(OI)(CI)F" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Administrator database access could not be prepared"
    }
    Get-ChildItem -LiteralPath $dataDirectory -Filter "bioems.db*" -File -ErrorAction Stop |
        ForEach-Object {
            & takeown.exe /F $_.FullName /A | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Administrator database-file ownership could not be prepared"
            }
            & icacls.exe $_.FullName /inheritance:r /grant:r "SYSTEM:F" "BUILTIN\Administrators:F" "NT SERVICE\BIOEMS-Backend:M" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Administrator database-file access could not be prepared"
            }
        }
    Write-Diagnostic "starting one-time customer administrator bootstrap"
    $bootstrapOutput = @(& $nodes[0].FullName $script 2>&1)
    $bootstrapExitCode = $LASTEXITCODE
    $bootstrapOutput | ForEach-Object { Write-Diagnostic "node: $_" }
    if ($bootstrapExitCode -ne 0) {
        throw "Administrator bootstrap command failed with exit code $bootstrapExitCode"
    }
    Get-ChildItem -LiteralPath $dataDirectory -Filter "bioems.db*" -File -ErrorAction Stop |
        ForEach-Object {
            & icacls.exe $_.FullName /inheritance:r /grant:r "SYSTEM:F" "BUILTIN\Administrators:F" "NT SERVICE\BIOEMS-Backend:M" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Backend database-file access could not be restored"
            }
            & icacls.exe $_.FullName /setowner "SYSTEM" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "Backend database-file ownership could not be restored"
            }
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
    Remove-Item Env:BIOEMS_BOOTSTRAP_CUSTOMER_NAME -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_CUSTOMER_CODE -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_SITE_NAME -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_SITE_CODE -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_BOOTSTRAP_SITE_LOCATION -ErrorAction SilentlyContinue
    Remove-Item Env:BIOEMS_SQLITE_PATH -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $CredentialFile -Force -ErrorAction SilentlyContinue
    Start-Service -Name "BIOEMS-Backend" -ErrorAction SilentlyContinue
}

Write-Host "BIO-EMS customer administrator initialization: PASS"
