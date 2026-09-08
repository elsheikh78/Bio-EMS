[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RepositoryRoot,
    [Parameter(Mandatory = $true)]
    [string]$StagingDirectory,
    [Parameter(Mandatory = $true)]
    [string]$InnoCompiler,
    [Parameter(Mandatory = $true)]
    [string]$CommercialLicenseEvidence
)

$ErrorActionPreference = "Stop"
$repository = [System.IO.Path]::GetFullPath($RepositoryRoot)
$staging = [System.IO.Path]::GetFullPath($StagingDirectory)
$compiler = [System.IO.Path]::GetFullPath($InnoCompiler)
$licenseEvidence = [System.IO.Path]::GetFullPath($CommercialLicenseEvidence)

foreach ($requiredFile in @(
    $compiler,
    $licenseEvidence,
    (Join-Path $staging "package-manifest.json")
)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required controlled build input is missing"
    }
}

$compilerVersion = (& $compiler "/?") 2>&1 | Out-String
if ($compilerVersion -notmatch 'Inno Setup.*6\.7\.3') {
    throw "Inno Setup compiler must be version 6.7.3"
}

$env:BIOEMS_INSTALLER_STAGING_DIR = $staging
& npm run validate:windows-installer --prefix (Join-Path $repository "backend")
if ($LASTEXITCODE -ne 0) { throw "Installer staging validation failed" }

$version = (Get-Content (Join-Path $repository "VERSION") -Raw).Trim()
$source = Join-Path $repository "installer\windows\BioEMS.iss"
& $compiler "/Qp" "/DStageRoot=$staging" "/DProductVersion=$version" $source
if ($LASTEXITCODE -ne 0) { throw "Inno Setup compilation failed" }

$setupPath = Join-Path $staging "output\BIO-EMS-Setup-$version-x64.exe"
if (-not (Test-Path -LiteralPath $setupPath -PathType Leaf)) {
    throw "Expected Setup output is missing"
}

$evidence = [ordered]@{
    schemaVersion = 1
    productVersion = $version
    setupFile = [System.IO.Path]::GetFileName($setupPath)
    setupSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $setupPath).Hash.ToLowerInvariant()
    packageManifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $staging "package-manifest.json")).Hash.ToLowerInvariant()
    compiler = "Inno Setup 6.7.3"
    commercialLicenseEvidenceSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $licenseEvidence).Hash.ToLowerInvariant()
    builtAt = (Get-Date).ToUniversalTime().ToString("o")
}
$json = $evidence | ConvertTo-Json -Depth 4
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    (Join-Path $staging "output\build-evidence.json"),
    $json,
    $utf8WithoutBom
)
Write-Host "BIO-EMS Setup build: PASS"

