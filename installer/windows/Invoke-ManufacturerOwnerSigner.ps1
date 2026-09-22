#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$repository = [IO.Path]::GetFullPath($RepositoryRoot)
$backend = Join-Path $repository "backend"
$issuer = Join-Path $backend "src\scripts\issue-owner-commissioning-package.ts"
if (-not (Test-Path -LiteralPath $issuer -PathType Leaf)) {
    [System.Windows.Forms.MessageBox]::Show(
        "Run this utility from the controlled BIO-EMS source checkout.",
        "BIO-EMS Manufacturer Signer", "OK", "Error"
    ) | Out-Null
    exit 1
}

function Add-Field {
    param(
        [System.Windows.Forms.Form]$Form,
        [string]$Label,
        [int]$Top,
        [bool]$Secret = $false
    )
    $caption = New-Object System.Windows.Forms.Label
    $caption.Text = $Label
    $caption.Location = New-Object Drawing.Point(28, $Top)
    $caption.Size = New-Object Drawing.Size(190, 25)
    $Form.Controls.Add($caption)
    $input = New-Object System.Windows.Forms.TextBox
    $input.Location = New-Object Drawing.Point(220, ($Top - 3))
    $input.Size = New-Object Drawing.Size(430, 28)
    $input.UseSystemPasswordChar = $Secret
    $Form.Controls.Add($input)
    return $input
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "BIO-EMS Manufacturer Owner Signer"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object Drawing.Size(710, 590)
$form.Font = New-Object Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "Offline System Owner activation signer"
$title.Font = New-Object Drawing.Font("Segoe UI Semibold", 18)
$title.AutoSize = $true
$title.Location = New-Object Drawing.Point(28, 20)
$form.Controls.Add($title)

$warning = New-Object System.Windows.Forms.Label
$warning.Text = "Company-controlled workstation only. Keep the private key and passphrase offline. Only the signed output package goes to the customer computer."
$warning.Location = New-Object Drawing.Point(30, 65)
$warning.Size = New-Object Drawing.Size(620, 48)
$form.Controls.Add($warning)

$requestPath = Add-Field $form "Commissioning request" 130
$privateKeyPath = Add-Field $form "Encrypted Ed25519 key" 175
$keyId = Add-Field $form "Key ID" 220
$username = Add-Field $form "Owner username" 265
$password = Add-Field $form "Owner password" 310 $true
$confirmation = Add-Field $form "Confirm password" 355 $true
$passphrase = Add-Field $form "Private-key passphrase" 400 $true
$keyId.Text = "owner-primary-2026"
$username.Text = "system-owner"

$browseRequest = New-Object System.Windows.Forms.Button
$browseRequest.Text = "..."
$browseRequest.Location = New-Object Drawing.Point(655, 127)
$browseRequest.Size = New-Object Drawing.Size(32, 29)
$form.Controls.Add($browseRequest)
$browseRequest.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = "BIO-EMS commissioning request (*.json)|*.json"
    if ($dialog.ShowDialog() -eq "OK") { $requestPath.Text = $dialog.FileName }
})

$browseKey = New-Object System.Windows.Forms.Button
$browseKey.Text = "..."
$browseKey.Location = New-Object Drawing.Point(655, 172)
$browseKey.Size = New-Object Drawing.Size(32, 29)
$form.Controls.Add($browseKey)
$browseKey.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = "PEM private key (*.pem)|*.pem|All files (*.*)|*.*"
    if ($dialog.ShowDialog() -eq "OK") { $privateKeyPath.Text = $dialog.FileName }
})

$issue = New-Object System.Windows.Forms.Button
$issue.Text = "Issue signed activation package"
$issue.Location = New-Object Drawing.Point(220, 465)
$issue.Size = New-Object Drawing.Size(280, 46)
$form.Controls.Add($issue)

$status = New-Object System.Windows.Forms.Label
$status.Location = New-Object Drawing.Point(30, 525)
$status.Size = New-Object Drawing.Size(620, 30)
$form.Controls.Add($status)

$issue.Add_Click({
    $output = $null
    $previous = @{}
    try {
        if (-not (Test-Path -LiteralPath $requestPath.Text -PathType Leaf)) {
            throw "Select a valid commissioning request."
        }
        if (-not (Test-Path -LiteralPath $privateKeyPath.Text -PathType Leaf)) {
            throw "Select the encrypted Ed25519 private key."
        }
        if ($username.Text -notmatch "^[a-z0-9._-]{3,64}$") {
            throw "Owner username must use 3-64 lowercase letters, digits, dot, underscore or hyphen."
        }
        if ($password.Text -ne $confirmation.Text) { throw "The passwords do not match." }
        if (
            $password.Text.Length -lt 12 -or
            $password.Text -notmatch "[A-Z]" -or
            $password.Text -notmatch "[a-z]" -or
            $password.Text -notmatch "[0-9]" -or
            $password.Text -notmatch "[^A-Za-z0-9]"
        ) {
            throw "Use at least 12 characters with uppercase, lowercase, number and symbol."
        }
        if ([string]::IsNullOrWhiteSpace($passphrase.Text)) {
            throw "Enter the encrypted private-key passphrase."
        }

        $dialog = New-Object System.Windows.Forms.SaveFileDialog
        $dialog.Filter = "BIO-EMS signed activation package (*.json)|*.json"
        $dialog.FileName = "BIO-EMS-Owner-Activation.json"
        if ($dialog.ShowDialog() -ne "OK") { return }
        if (Test-Path -LiteralPath $dialog.FileName) {
            throw "Choose a new output file name. Existing packages are not overwritten."
        }
        $output = $dialog.FileName

        $values = @{
            BIOEMS_OWNER_COMMISSIONING_REQUEST = $requestPath.Text
            BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY = $privateKeyPath.Text
            BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY_PASSPHRASE = $passphrase.Text
            BIOEMS_OWNER_COMMISSIONING_PACKAGE_OUTPUT = $output
            BIOEMS_OWNER_COMMISSIONING_KEY_ID = $keyId.Text
            BIOEMS_OWNER_COMMISSIONING_USERNAME = $username.Text
            BIOEMS_OWNER_COMMISSIONING_PASSWORD = $password.Text
            BIOEMS_OWNER_COMMISSIONING_VALIDITY_MINUTES = "15"
        }
        foreach ($name in $values.Keys) {
            $previous[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
            [Environment]::SetEnvironmentVariable($name, $values[$name], "Process")
        }

        Push-Location $backend
        try {
            & npm run owner:commissioning-issue
            if ($LASTEXITCODE -ne 0) { throw "The signing operation was rejected." }
        }
        finally {
            Pop-Location
        }

        $status.Text = "Signed package created. Transfer only the output JSON to the customer host."
        [System.Windows.Forms.MessageBox]::Show(
            "Signed activation package created successfully.",
            $form.Text, "OK", "Information"
        ) | Out-Null
    }
    catch {
        if ($output -and (Test-Path -LiteralPath $output)) {
            Remove-Item -LiteralPath $output -Force -ErrorAction SilentlyContinue
        }
        $status.Text = "Signing failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, $form.Text, "OK", "Error") |
            Out-Null
    }
    finally {
        foreach ($name in $previous.Keys) {
            [Environment]::SetEnvironmentVariable($name, $previous[$name], "Process")
        }
        $password.Clear()
        $confirmation.Clear()
        $passphrase.Clear()
    }
})

[void]$form.ShowDialog()
