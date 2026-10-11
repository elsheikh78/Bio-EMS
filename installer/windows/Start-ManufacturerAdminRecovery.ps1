#Requires -Version 5.1
[CmdletBinding()]
param([string]$ToolRoot = $PSScriptRoot)
try {
    & (Join-Path $ToolRoot 'Invoke-ManufacturerAdminRecovery.ps1') -ToolRoot $ToolRoot
} catch {
    Add-Type -AssemblyName System.Windows.Forms
    [Windows.Forms.MessageBox]::Show($_.Exception.Message,'BIO-EMS ADMIN Recovery','OK','Error') | Out-Null
}
