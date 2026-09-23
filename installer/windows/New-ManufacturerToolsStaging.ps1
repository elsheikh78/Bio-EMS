[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RepositoryRoot,
    [Parameter(Mandatory = $true)][string]$VendorCache,
    [Parameter(Mandatory = $true)][string]$StagingDirectory
)

$ErrorActionPreference = "Stop"
$repository = [IO.Path]::GetFullPath($RepositoryRoot)
$vendor = [IO.Path]::GetFullPath($VendorCache)
$staging = [IO.Path]::GetFullPath($StagingDirectory)
if ($staging -eq [IO.Path]::GetPathRoot($staging) -or $staging -eq $repository) {
    throw "Unsafe manufacturer-tools staging directory"
}
if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Path (Join-Path $staging "payload") -Force | Out-Null

& npm ci --prefix (Join-Path $repository "backend")
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed" }
& npm run build --prefix (Join-Path $repository "backend")
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

$backendStage = Join-Path $staging "work\backend"
New-Item -ItemType Directory -Path $backendStage -Force | Out-Null
Copy-Item (Join-Path $repository "backend\dist") $backendStage -Recurse
Copy-Item (Join-Path $repository "backend\package.json") $backendStage
Copy-Item (Join-Path $repository "backend\package-lock.json") $backendStage
& npm ci --omit=dev --prefix $backendStage
if ($LASTEXITCODE -ne 0) { throw "Manufacturer runtime dependency staging failed" }

Compress-Archive -Path (Join-Path $backendStage "*") -DestinationPath (Join-Path $staging "payload\manufacturer-backend.zip") -CompressionLevel Optimal

$nodeArchive = Join-Path $vendor "node-v22.22.0-win-x64.zip"
if (-not (Test-Path -LiteralPath $nodeArchive -PathType Leaf)) {
    throw "Pinned Node.js runtime archive is missing"
}
Copy-Item -LiteralPath $nodeArchive -Destination (Join-Path $staging "payload")

@(
    "Invoke-ManufacturerOwnerSigner.ps1",
    "Start-ManufacturerOwnerSigner.ps1"
) | ForEach-Object {
    $script = Join-Path $repository "installer\windows\$_"
    Copy-Item -LiteralPath $script -Destination (Join-Path $staging "payload")
}
Remove-Item -LiteralPath (Join-Path $staging "work") -Recurse -Force
Write-Host "BIO-EMS Manufacturer Tools staging: PASS"
