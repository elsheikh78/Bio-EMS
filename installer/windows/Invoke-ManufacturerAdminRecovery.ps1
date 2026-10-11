#Requires -Version 5.1
[CmdletBinding()]
param([string]$ToolRoot = $PSScriptRoot, [string]$RepositoryRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$installedNode = Get-ChildItem -LiteralPath (Join-Path $ToolRoot 'runtime') -Filter 'node.exe' -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
$issuer = Join-Path $ToolRoot 'backend\dist\src\scripts\issue-admin-recovery-package.js'
$form = New-Object Windows.Forms.Form
$form.Text = 'BIO-EMS Customer ADMIN Recovery'
$form.Size = New-Object Drawing.Size(800, 660)
$form.StartPosition = 'CenterScreen'
$form.Font = New-Object Drawing.Font('Segoe UI', 10)
function Add-Field([string]$label, [int]$top, [bool]$secret = $false) {
    $caption = New-Object Windows.Forms.Label
    $caption.Text = $label; $caption.Location = New-Object Drawing.Point(20,$top); $caption.Size = New-Object Drawing.Size(190,25)
    $form.Controls.Add($caption)
    $input = New-Object Windows.Forms.TextBox
    $input.Location = New-Object Drawing.Point(210,$top); $input.Size = New-Object Drawing.Size(500,28); $input.UseSystemPasswordChar = $secret
    $form.Controls.Add($input)
    return $input
}
$request = Add-Field 'Customer request JSON' 25
$key = Add-Field 'Encrypted recovery key' 70
$keyId = Add-Field 'Recovery key ID' 115
$keyId.Text = 'admin-recovery-2026'
$passphrase = Add-Field 'Key passphrase' 160 $true
$minutes = Add-Field 'Permit validity (1-60 min)' 205
$minutes.Text = '60'
$preview = New-Object Windows.Forms.TextBox
$preview.Multiline = $true; $preview.ReadOnly = $true; $preview.Location = New-Object Drawing.Point(20,255); $preview.Size = New-Object Drawing.Size(740,180)
$form.Controls.Add($preview)
$verified = New-Object Windows.Forms.CheckBox
$verified.Text = 'I verified the customer identity and the request details through a known contact.'
$verified.Location = New-Object Drawing.Point(20,450); $verified.Size = New-Object Drawing.Size(740,30)
$form.Controls.Add($verified)
foreach ($field in @($request,$key,$keyId)) { $field.Add_TextChanged({ $verified.Checked = $false }) }
$browseRequest = New-Object Windows.Forms.Button
$browseRequest.Text = '...'; $browseRequest.Location = New-Object Drawing.Point(720,25); $browseRequest.Size = New-Object Drawing.Size(40,28)
$form.Controls.Add($browseRequest)
$browseRequest.Add_Click({
    try {
        $dialog = New-Object Windows.Forms.OpenFileDialog; $dialog.Filter = 'JSON request (*.json)|*.json'
        if ($dialog.ShowDialog() -ne 'OK') { return }
        if ((Get-Item -LiteralPath $dialog.FileName).Length -gt 16384) { throw 'Request too large' }
        $data = Get-Content -LiteralPath $dialog.FileName -Raw | ConvertFrom-Json
        if ($data.purpose -ne 'CUSTOMER_ADMIN_RECOVERY_REQUEST') { throw 'Not an ADMIN recovery request' }
        $request.Text = $dialog.FileName
        $preview.Text = "Customer: $($data.customerName) [$($data.customerCode)]`r`nSite: $($data.siteName) [$($data.siteCode)]`r`nInstallation: $($data.installationId)`r`nAccount: $($data.username)`r`nRequest: $($data.requestId)`r`nExpires: $($data.expiresAt)`r`nRequest data is unverified until you confirm it with the customer."
    } catch { [Windows.Forms.MessageBox]::Show($_.Exception.Message,$form.Text) | Out-Null }
})
$browseKey = New-Object Windows.Forms.Button
$browseKey.Text = '...'; $browseKey.Location = New-Object Drawing.Point(720,70); $browseKey.Size = New-Object Drawing.Size(40,28)
$form.Controls.Add($browseKey)
$browseKey.Add_Click({
    $dialog = New-Object Windows.Forms.OpenFileDialog; $dialog.Filter = 'Encrypted PEM (*.pem)|*.pem'
    if ($dialog.ShowDialog() -eq 'OK') { $key.Text = $dialog.FileName }
})
function Run-Issuer([string]$mode) {
    $previous = @{}
    $reviewedHash = ''
    try {
        if (($mode -ne 'generate-key' -and -not (Test-Path -LiteralPath $key.Text -PathType Leaf)) -or [string]::IsNullOrWhiteSpace($passphrase.Text)) { throw 'Select the encrypted recovery key and enter its passphrase' }
        if ($mode -eq 'generate-key') {
            if ($passphrase.Text.Length -lt 16) { throw 'Use at least 16 characters for the new private-key passphrase' }
            $keyDialog = New-Object Windows.Forms.SaveFileDialog; $keyDialog.Filter = 'Encrypted PEM (*.pem)|*.pem'; $keyDialog.FileName = 'admin-recovery-2026.private.pem'
            if ($keyDialog.ShowDialog() -ne 'OK') { return }
            if (Test-Path -LiteralPath $keyDialog.FileName) { throw 'Key already exists; use a new filename' }
            $key.Text = $keyDialog.FileName
        }
        if ($mode -eq 'issue') {
            if (-not $verified.Checked) { throw 'Verify requester identity and request details first' }
            if (-not (Test-Path -LiteralPath $request.Text -PathType Leaf)) { throw 'Select a request file' }
            if ((Get-Item -LiteralPath $request.Text).Length -gt 16384) { throw 'Request too large' }
            $reviewedHash = (Get-FileHash -LiteralPath $request.Text -Algorithm SHA256).Hash.ToLowerInvariant()
            # Re-read at signing time so the displayed file cannot silently change.
            $data = Get-Content -LiteralPath $request.Text -Raw | ConvertFrom-Json
            $message = "Issue a password-reset permit for $($data.username) at $($data.customerName) / $($data.siteName)?`r`nInstallation: $($data.installationId)`r`nRequest: $($data.requestId)"
            if ([Windows.Forms.MessageBox]::Show($message,$form.Text,'YesNo','Warning') -ne 'Yes') { return }
        }
        $dialog = New-Object Windows.Forms.SaveFileDialog; $dialog.Filter = 'JSON (*.json)|*.json'
        $dialog.FileName = if ($mode -ne 'issue') { 'manufacturer-admin-recovery-trust.json' } else { 'BIO-EMS-Admin-Recovery-Permit.json' }
        if ($dialog.ShowDialog() -ne 'OK') { return }
        if (Test-Path -LiteralPath $dialog.FileName) { throw 'Choose a new output filename' }
        $values = @{
            BIOEMS_ADMIN_RECOVERY_MODE=$mode; BIOEMS_ADMIN_RECOVERY_REQUEST=$request.Text
            BIOEMS_ADMIN_RECOVERY_PRIVATE_KEY=$key.Text; BIOEMS_ADMIN_RECOVERY_PASSPHRASE=$passphrase.Text
            BIOEMS_ADMIN_RECOVERY_KEY_ID=$keyId.Text; BIOEMS_ADMIN_RECOVERY_OUTPUT=$dialog.FileName
            BIOEMS_ADMIN_RECOVERY_VALIDITY_MINUTES=$minutes.Text; BIOEMS_ADMIN_RECOVERY_REQUEST_SHA256=$reviewedHash
        }
        foreach ($name in $values.Keys) { $previous[$name]=[Environment]::GetEnvironmentVariable($name,'Process'); [Environment]::SetEnvironmentVariable($name,$values[$name],'Process') }
        if ($installedNode -and (Test-Path -LiteralPath $issuer)) {
            & $installedNode.FullName $issuer
            if ($LASTEXITCODE -ne 0) { throw 'Signing operation rejected' }
        } else {
            Push-Location (Join-Path $RepositoryRoot 'backend')
            try { & npm run admin:recovery-issue; if ($LASTEXITCODE -ne 0) { throw 'Signing operation rejected' } } finally { Pop-Location }
        }
        $notice = if ($mode -ne 'issue') { 'Public trust file exported. Install only through controlled Windows administration or approved Setup staging. Customer uploads never establish trust.' } else { 'Signed permit created. Send only this permit JSON to the verified customer. No password was selected by the company.' }
        [Windows.Forms.MessageBox]::Show($notice,$form.Text,'OK','Information') | Out-Null
    } catch { [Windows.Forms.MessageBox]::Show($_.Exception.Message,$form.Text,'OK','Error') | Out-Null }
    finally { foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name,$previous[$name],'Process') }; $passphrase.Clear(); $verified.Checked=$false }
}
$issue = New-Object Windows.Forms.Button
$issue.Text = 'Issue signed reset permit'; $issue.Location = New-Object Drawing.Point(210,500); $issue.Size = New-Object Drawing.Size(250,45)
$form.Controls.Add($issue); $issue.Add_Click({ Run-Issuer 'issue' })
$export = New-Object Windows.Forms.Button
$export.Text = 'Export public trust file'; $export.Location = New-Object Drawing.Point(480,500); $export.Size = New-Object Drawing.Size(250,45)
$form.Controls.Add($export); $export.Add_Click({ Run-Issuer 'export-trust' })
$generate = New-Object Windows.Forms.Button
$generate.Text = 'Generate encrypted recovery key'; $generate.Location = New-Object Drawing.Point(210,560); $generate.Size = New-Object Drawing.Size(350,35)
$form.Controls.Add($generate); $generate.Add_Click({ Run-Issuer 'generate-key' })
[void]$form.ShowDialog()
