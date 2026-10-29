[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DestinationDirectory
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $scriptRoot "VendorDownload.psm1") -Force
$lock = Get-Content (Join-Path $scriptRoot "vendor-input-lock.json") -Raw | ConvertFrom-Json
$destination = [System.IO.Path]::GetFullPath($DestinationDirectory)
New-Item -ItemType Directory -Force -Path $destination | Out-Null

foreach ($input in $lock.inputs) {
    $target = Join-Path $destination $input.fileName
    Get-VerifiedVendorInput -Source $input.sourceUrl -Target $target -Sha256 $input.sha256
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLowerInvariant()
    if ($actual -ne $input.sha256) {
        throw "Vendor input checksum mismatch: $($input.id)"
    }
    Write-Host "Verified vendor input: $($input.id) $($input.version)"
}

Write-Host "BIO-EMS vendor input acquisition: PASS"

