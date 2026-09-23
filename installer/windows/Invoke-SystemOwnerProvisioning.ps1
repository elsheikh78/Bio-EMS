#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ApplicationRoot = (Join-Path $env:ProgramFiles "BIO-EMS"),
    [string]$PersistentRoot = (Join-Path $env:ProgramData "BIO-EMS"),
    [switch]$ValidateOnly
)

$ErrorActionPreference = "Stop"

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $ValidateOnly -and -not (Test-Administrator)) {
    $arguments = @(
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ('"{0}"' -f $PSCommandPath),
        "-ApplicationRoot", ('"{0}"' -f $ApplicationRoot),
        "-PersistentRoot", ('"{0}"' -f $PersistentRoot)
    )
    Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -Verb RunAs
    exit 0
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$application = [IO.Path]::GetFullPath($ApplicationRoot)
$persistent = [IO.Path]::GetFullPath($PersistentRoot)
$expectedApplication = [IO.Path]::GetFullPath((Join-Path $env:ProgramFiles "BIO-EMS"))
$expectedPersistent = [IO.Path]::GetFullPath((Join-Path $env:ProgramData "BIO-EMS"))
if ($application -ne $expectedApplication -or $persistent -ne $expectedPersistent) {
    throw "System Owner Provisioning only operates on the installed BIO-EMS paths."
}

$nodeFile = Get-ChildItem -LiteralPath (Join-Path $application "runtime") -Filter "node.exe" -File -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1
$node = if ($null -ne $nodeFile) {
    $nodeFile.FullName
}
else {
    Join-Path $application "runtime\node.exe"
}
$requestScript = Join-Path $application "backend\dist\src\scripts\create-owner-commissioning-request.js"
$importScript = Join-Path $application "backend\dist\src\scripts\import-owner-commissioning-package.js"
$identityPath = Join-Path $persistent "licensing\installation-identity.json"
$environmentPath = Join-Path $persistent "config\backend.env"

foreach ($required in @($node, $requestScript, $importScript, $identityPath, $environmentPath)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        [System.Windows.Forms.MessageBox]::Show(
            "Required BIO-EMS file is missing:`r`n$required",
            "BIO-EMS System Owner Provisioning",
            "OK",
            "Error"
        ) | Out-Null
        exit 1
    }
}

if ($ValidateOnly) {
    Write-Output "BIO-EMS System Owner Provisioning preflight: PASS"
    return
}

function Invoke-OwnerTool {
    param(
        [Parameter(Mandatory = $true)][string]$Script,
        [Parameter(Mandatory = $true)][hashtable]$Environment
    )
    $previous = @{}
    try {
        foreach ($name in $Environment.Keys) {
            $previous[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
            [Environment]::SetEnvironmentVariable($name, $Environment[$name], "Process")
        }
        & $node $Script
        if ($LASTEXITCODE -ne 0) { throw "BIO-EMS owner operation was rejected." }
    }
    finally {
        foreach ($name in $Environment.Keys) {
            [Environment]::SetEnvironmentVariable($name, $previous[$name], "Process")
        }
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "BIO-EMS System Owner Provisioning"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object Drawing.Size(620, 400)
$form.MinimumSize = New-Object Drawing.Size(620, 400)
$form.Font = New-Object Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "System Owner activation"
$title.Font = New-Object Drawing.Font("Segoe UI Semibold", 18)
$title.AutoSize = $true
$title.Location = New-Object Drawing.Point(28, 24)
$form.Controls.Add($title)

$description = New-Object System.Windows.Forms.Label
$description.Text = "This local company-controlled utility creates an installation-bound request and imports the signed activation package. It never asks for or stores the manufacturer private key."
$description.Location = New-Object Drawing.Point(31, 72)
$description.Size = New-Object Drawing.Size(550, 58)
$form.Controls.Add($description)

$identity = Get-Content -LiteralPath $identityPath -Raw | ConvertFrom-Json
$installation = New-Object System.Windows.Forms.TextBox
$installation.ReadOnly = $true
$installation.Text = [string]$identity.installationId
$installation.Location = New-Object Drawing.Point(32, 150)
$installation.Size = New-Object Drawing.Size(548, 28)
$form.Controls.Add($installation)

$requestButton = New-Object System.Windows.Forms.Button
$requestButton.Text = "1. Create commissioning request"
$requestButton.Location = New-Object Drawing.Point(32, 205)
$requestButton.Size = New-Object Drawing.Size(260, 44)
$form.Controls.Add($requestButton)

$importButton = New-Object System.Windows.Forms.Button
$importButton.Text = "2. Import signed activation package"
$importButton.Location = New-Object Drawing.Point(320, 205)
$importButton.Size = New-Object Drawing.Size(260, 44)
$form.Controls.Add($importButton)

$status = New-Object System.Windows.Forms.Label
$status.Text = "No credentials are created until a valid signed package is imported."
$status.Location = New-Object Drawing.Point(32, 280)
$status.Size = New-Object Drawing.Size(548, 48)
$form.Controls.Add($status)

$requestButton.Add_Click({
    try {
        $dialog = New-Object System.Windows.Forms.SaveFileDialog
        $dialog.Filter = "BIO-EMS commissioning request (*.json)|*.json"
        $dialog.FileName = "BIO-EMS-Owner-Request-$($identity.installationId).json"
        if ($dialog.ShowDialog() -ne "OK") { return }
        if (Test-Path -LiteralPath $dialog.FileName) {
            [System.Windows.Forms.MessageBox]::Show(
                "Choose a new file name. Existing request files are not overwritten.",
                $form.Text, "OK", "Warning"
            ) | Out-Null
            return
        }
        Invoke-OwnerTool -Script $requestScript -Environment @{
            BIOEMS_ENV_FILE = $environmentPath
            BIOEMS_INSTALLATION_IDENTITY_PATH = $identityPath
            BIOEMS_OWNER_COMMISSIONING_REQUEST_OUTPUT = $dialog.FileName
        }
        $status.Text = "Request created. Transfer only this request to the offline manufacturer signer."
        [System.Windows.Forms.MessageBox]::Show(
            "Commissioning request created successfully.",
            $form.Text, "OK", "Information"
        ) | Out-Null
    }
    catch {
        $status.Text = "Request creation failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, $form.Text, "OK", "Error") |
            Out-Null
    }
})

$importButton.Add_Click({
    $serviceWasRunning = $false
    try {
        $dialog = New-Object System.Windows.Forms.OpenFileDialog
        $dialog.Filter = "BIO-EMS signed activation package (*.json)|*.json"
        if ($dialog.ShowDialog() -ne "OK") { return }
        $service = Get-Service -Name "BIOEMS-Backend" -ErrorAction Stop
        $serviceWasRunning = $service.Status -eq "Running"
        if ($serviceWasRunning) {
            Stop-Service -Name "BIOEMS-Backend" -Force -ErrorAction Stop
            $service.WaitForStatus("Stopped", [TimeSpan]::FromSeconds(30))
        }
        Invoke-OwnerTool -Script $importScript -Environment @{
            BIOEMS_ENV_FILE = $environmentPath
            BIOEMS_INSTALLATION_IDENTITY_PATH = $identityPath
            BIOEMS_OWNER_COMMISSIONING_PACKAGE = $dialog.FileName
        }
        $status.Text = "System Owner created. Open the owner sign-in page and enroll MFA."
        [System.Windows.Forms.MessageBox]::Show(
            "System Owner created successfully.`r`nOpen https://localhost/system-owner/login to enroll MFA.",
            $form.Text, "OK", "Information"
        ) | Out-Null
    }
    catch {
        $status.Text = "Signed package import failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, $form.Text, "OK", "Error") |
            Out-Null
    }
    finally {
        if ($serviceWasRunning) {
            Start-Service -Name "BIOEMS-Backend" -ErrorAction SilentlyContinue
        }
    }
})

[void]$form.ShowDialog()
