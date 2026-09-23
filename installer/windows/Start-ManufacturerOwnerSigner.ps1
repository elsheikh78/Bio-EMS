#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ToolRoot = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$resolvedRoot = [IO.Path]::GetFullPath($ToolRoot)
$signer = Join-Path $resolvedRoot "Invoke-ManufacturerOwnerSigner.ps1"
$logRoot = Join-Path $env:ProgramData "BIO-EMS-Manufacturer-Tools\logs"
$logFile = Join-Path $logRoot "manufacturer-owner-signer.log"

try {
    if (-not (Test-Path -LiteralPath $signer -PathType Leaf)) {
        throw "The Manufacturer Owner Signer application file is missing."
    }

    & $signer -ToolRoot $resolvedRoot
}
catch {
    New-Item -ItemType Directory -Path $logRoot -Force -ErrorAction SilentlyContinue | Out-Null
    $details = @(
        "Timestamp: $([DateTime]::UtcNow.ToString('o'))"
        "Message: $($_.Exception.Message)"
        "Category: $($_.CategoryInfo)"
        "Stack: $($_.ScriptStackTrace)"
        ""
    ) -join [Environment]::NewLine
    Add-Content -LiteralPath $logFile -Value $details -Encoding UTF8 -ErrorAction SilentlyContinue

    Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
    [System.Windows.Forms.MessageBox]::Show(
        "$($_.Exception.Message)$([Environment]::NewLine)$([Environment]::NewLine)Diagnostic log:$([Environment]::NewLine)$logFile",
        "BIO-EMS Manufacturer Owner Signer",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}
