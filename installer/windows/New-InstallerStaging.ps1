[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RepositoryRoot,
    [Parameter(Mandatory = $true)]
    [string]$VendorCache,
    [Parameter(Mandatory = $true)]
    [string]$StagingDirectory,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-f0-9]{40}$')]
    [string]$SourceCommit,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')]
    [string]$BuildTimestamp,
    [ValidateSet("Pilot", "Production")]
    [string]$ReleaseChannel = "Production",
    [string]$OwnerTrustKeyring
)

$ErrorActionPreference = "Stop"
$fixedTimestamp = [DateTimeOffset]::Parse("2000-01-01T00:00:00Z")
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repository = [System.IO.Path]::GetFullPath($RepositoryRoot)
$vendor = [System.IO.Path]::GetFullPath($VendorCache)
$staging = [System.IO.Path]::GetFullPath($StagingDirectory)

if ($ReleaseChannel -eq "Production" -and [string]::IsNullOrWhiteSpace($OwnerTrustKeyring)) {
    $OwnerTrustKeyring = Join-Path $repository "installer\\windows\\manufacturer-owner-trust.json"
}

if ($staging -eq [System.IO.Path]::GetPathRoot($staging) -or $staging -eq $repository) {
    throw "Unsafe staging directory"
}
if (Test-Path -LiteralPath $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
New-Item -ItemType Directory -Path (Join-Path $staging "payload") -Force | Out-Null

$ownerTrustArtifact = $null
if ($ReleaseChannel -eq "Production") {
    if ([string]::IsNullOrWhiteSpace($OwnerTrustKeyring)) {
        throw "Production staging requires an owner commissioning trust keyring"
    }
    $keyringPath = [System.IO.Path]::GetFullPath($OwnerTrustKeyring)
    if (-not (Test-Path -LiteralPath $keyringPath -PathType Leaf)) {
        throw "Owner commissioning trust keyring was not found"
    }
    $keyring = Get-Content -LiteralPath $keyringPath -Raw | ConvertFrom-Json
    if ($keyring.schemaVersion -ne 1 -or -not $keyring.keys -or $keyring.keys.Count -lt 1) {
        throw "Invalid owner commissioning trust keyring"
    }
    $keyIds = @{}
    $activeKeys = 0
    foreach ($key in $keyring.keys) {
        $validKeyId = $key.keyId -match "^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$"
        $validPublicKey = -not [string]::IsNullOrWhiteSpace($key.publicKeyPem) -and
            $key.publicKeyPem -match "-----BEGIN PUBLIC KEY-----"
        $validStatus = @("active", "revoked") -contains $key.status
        if (-not $validKeyId -or -not $validPublicKey -or -not $validStatus -or $keyIds.ContainsKey($key.keyId)) {
            throw "Invalid owner commissioning trust key entry"
        }
        $keyIds[$key.keyId] = $true
        if ($key.status -eq "active") { $activeKeys++ }
    }
    if ($activeKeys -lt 1) {
        throw "Production trust keyring requires at least one active key"
    }
    $trustRelativePath = "payload/manufacturer-owner-trust.json"
    Copy-Item -LiteralPath $keyringPath -Destination (Join-Path $staging $trustRelativePath)
    $ownerTrustArtifact = [ordered]@{
        id = "owner-commissioning-trust"
        version = "1"
        relativePath = $trustRelativePath
        redistributionEvidence = "BIO-EMS-MANUFACTURER-PUBLIC-KEYS"
    }
}
elseif (-not [string]::IsNullOrWhiteSpace($OwnerTrustKeyring)) {
    throw "Pilot staging must not embed the Production owner trust keyring"
}

function Invoke-Npm([string]$WorkingDirectory, [string[]]$Arguments) {
    & npm @Arguments --prefix $WorkingDirectory
    if ($LASTEXITCODE -ne 0) { throw "npm command failed" }
}

function New-DeterministicZip([string]$SourceDirectory, [string]$DestinationFile) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $stream = [System.IO.File]::Open($DestinationFile, [System.IO.FileMode]::CreateNew)
    try {
        $archive = New-Object System.IO.Compression.ZipArchive(
            $stream,
            [System.IO.Compression.ZipArchiveMode]::Create,
            $false
        )
        try {
            $source = [System.IO.Path]::GetFullPath($SourceDirectory)
            Get-ChildItem -LiteralPath $source -File -Recurse |
                Sort-Object FullName |
                ForEach-Object {
                    $relative = $_.FullName.Substring($source.Length).TrimStart('\', '/') -replace '\\', '/'
                    $entry = $archive.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
                    $entry.LastWriteTime = $fixedTimestamp
                    $inputStream = $_.OpenRead()
                    $outputStream = $entry.Open()
                    try { $inputStream.CopyTo($outputStream) }
                    finally { $outputStream.Dispose(); $inputStream.Dispose() }
                }
        }
        finally { $archive.Dispose() }
    }
    finally { $stream.Dispose() }
}

Invoke-Npm (Join-Path $repository "backend") @("ci")
Invoke-Npm (Join-Path $repository "backend") @("run", "build")
Invoke-Npm (Join-Path $repository "frontend") @("ci")
$env:VITE_API_BASE_URL = "https://localhost/api/v1"
Invoke-Npm (Join-Path $repository "frontend") @("run", "build")

$backendStage = Join-Path $staging "work\backend"
New-Item -ItemType Directory -Path $backendStage -Force | Out-Null
Copy-Item (Join-Path $repository "backend\dist") $backendStage -Recurse
Copy-Item (Join-Path $repository "backend\package.json") $backendStage
Copy-Item (Join-Path $repository "backend\package-lock.json") $backendStage
Invoke-Npm $backendStage @("ci", "--omit=dev")

$frontendStage = Join-Path $staging "work\frontend"
Copy-Item (Join-Path $repository "frontend\dist") $frontendStage -Recurse
New-DeterministicZip $backendStage (Join-Path $staging "payload\backend.zip")
New-DeterministicZip $frontendStage (Join-Path $staging "payload\frontend.zip")

$lock = Get-Content (Join-Path $scriptRoot "vendor-input-lock.json") -Raw | ConvertFrom-Json
$artifacts = @(
    [ordered]@{ id = "backend"; version = (Get-Content (Join-Path $repository "VERSION") -Raw).Trim(); relativePath = "payload/backend.zip"; redistributionEvidence = "PROPRIETARY-BIO-EMS" },
    [ordered]@{ id = "frontend"; version = (Get-Content (Join-Path $repository "VERSION") -Raw).Trim(); relativePath = "payload/frontend.zip"; redistributionEvidence = "PROPRIETARY-BIO-EMS" }
)
if ($null -ne $ownerTrustArtifact) {
    $artifacts += $ownerTrustArtifact
}
foreach ($input in $lock.inputs) {
    $source = Join-Path $vendor $input.fileName
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing vendor input: $($input.id)" }
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash.ToLowerInvariant()
    if ($actual -ne $input.sha256) { throw "Vendor input checksum mismatch: $($input.id)" }
    $relative = "payload/$($input.fileName)"
    Copy-Item -LiteralPath $source -Destination (Join-Path $staging $relative)
    $artifacts += [ordered]@{ id = $input.id; version = $input.version; relativePath = $relative; redistributionEvidence = $input.licenseEvidenceUrl }
}
foreach ($artifact in $artifacts) {
    $artifact.sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $staging $artifact.relativePath)).Hash.ToLowerInvariant()
}

$manifest = [ordered]@{
    schemaVersion = 1
    product = "BIO-EMS"
    productVersion = (Get-Content (Join-Path $repository "VERSION") -Raw).Trim()
    architecture = "x64"
    releaseChannel = $ReleaseChannel
    installerTechnology = "Inno Setup 6"
    generatedAt = $BuildTimestamp
    sourceCommit = $SourceCommit
    artifacts = $artifacts
}
$manifestJson = $manifest | ConvertTo-Json -Depth 8
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    (Join-Path $staging "package-manifest.json"),
    $manifestJson,
    $utf8WithoutBom
)
Remove-Item -LiteralPath (Join-Path $staging "work") -Recurse -Force

$env:BIOEMS_INSTALLER_STAGING_DIR = $staging
Invoke-Npm (Join-Path $repository "backend") @("run", "validate:windows-installer")
Write-Host "BIO-EMS deterministic staging: PASS"
