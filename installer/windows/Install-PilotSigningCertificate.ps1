#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$CertificatePath = (Join-Path $PSScriptRoot "BIO-EMS-Pilot-Code-Signing.cer"),
    [string]$ThumbprintPath = (Join-Path $PSScriptRoot "CERTIFICATE-THUMBPRINT.txt")
)

$ErrorActionPreference = "Stop"
$certificateFile = [System.IO.Path]::GetFullPath($CertificatePath)
$thumbprintFile = [System.IO.Path]::GetFullPath($ThumbprintPath)
foreach ($requiredFile in @($certificateFile, $thumbprintFile)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required BIO-EMS pilot signing evidence is missing"
    }
}

$certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certificateFile)
$expectedThumbprint = (Get-Content -LiteralPath $thumbprintFile -Raw).Trim().ToUpperInvariant()
if ($expectedThumbprint -notmatch '^[A-F0-9]{40}$' -or $certificate.Thumbprint -ne $expectedThumbprint) {
    throw "BIO-EMS pilot certificate thumbprint mismatch"
}
if ($certificate.Subject -ne "CN=BIO-EMS Pilot Internal Code Signing") {
    throw "Unexpected pilot certificate subject"
}
$codeSigningOid = "1.3.6.1.5.5.7.3.3"
if (-not ($certificate.Extensions.EnhancedKeyUsages.Value -contains $codeSigningOid)) {
    throw "Certificate is not restricted to code signing"
}
if ($certificate.NotAfter.ToUniversalTime() -le [DateTime]::UtcNow) {
    throw "BIO-EMS pilot signing certificate has expired"
}

Import-Certificate -FilePath $certificateFile -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
Import-Certificate -FilePath $certificateFile -CertStoreLocation "Cert:\LocalMachine\TrustedPublisher" | Out-Null
Write-Host "BIO-EMS pilot signing certificate trusted for this machine: $expectedThumbprint"
