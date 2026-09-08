[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DestinationDirectory
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$lock = Get-Content (Join-Path $scriptRoot "vendor-input-lock.json") -Raw | ConvertFrom-Json
$destination = [System.IO.Path]::GetFullPath($DestinationDirectory)
New-Item -ItemType Directory -Force -Path $destination | Out-Null

foreach ($input in $lock.inputs) {
    $target = Join-Path $destination $input.fileName
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $temporary = "$target.download"
        Invoke-WebRequest -UseBasicParsing -Uri $input.sourceUrl -OutFile $temporary
        Move-Item -LiteralPath $temporary -Destination $target
    }
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLowerInvariant()
    if ($actual -ne $input.sha256) {
        throw "Vendor input checksum mismatch: $($input.id)"
    }
    Write-Host "Verified vendor input: $($input.id) $($input.version)"
}

Write-Host "BIO-EMS vendor input acquisition: PASS"

