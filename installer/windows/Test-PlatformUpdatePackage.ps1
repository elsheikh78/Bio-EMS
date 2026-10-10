[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$PackagePath)
$ErrorActionPreference = "Stop"
$file = Get-Item -LiteralPath $PackagePath
if ($file.Extension -ne '.exe' -or $file.Length -lt 1048576 -or $file.Length -gt 536870912) { throw 'Unsupported update file' }
$signature = Get-AuthenticodeSignature -LiteralPath $file.FullName
if ($signature.Status -ne 'Valid' -or -not $signature.SignerCertificate) { throw 'Update signature is not trusted by Windows' }
$cert = $signature.SignerCertificate
$publishers = @(Get-ChildItem Cert:\LocalMachine\TrustedPublisher | Where-Object {
    $_.Thumbprint -eq $cert.Thumbprint -and $_.Subject -eq 'CN=BIO-EMS Pilot Internal Code Signing'
})
if ($publishers.Count -ne 1 -or $cert.NotAfter.ToUniversalTime() -le [DateTime]::UtcNow) { throw 'Update publisher is not an approved BIO-EMS publisher' }
$info = [Diagnostics.FileVersionInfo]::GetVersionInfo($file.FullName)
# Inno Setup pads version strings. ProductVersion has room for the full
# version + 40-character commit; FileVersion is truncated to 20 characters.
$productName = $info.ProductName.Trim()
$description = $info.FileDescription.Trim()
$productText = $info.ProductVersion.Trim()
if ($productName -ne 'BIO-EMS' -or $description -ne 'BIO-EMS Client Setup') {
    throw "File is not a BIO-EMS client update (product=$productName; description=$description)"
}
if ($productText -notmatch '^(\d+\.\d+\.\d+)\+([a-f0-9]{40})$') { throw 'Update version or full source commit is missing from signed product metadata' }
$productVersion = $matches[1]
$sourceCommit = $matches[2]
[ordered]@{sourceCommit=$sourceCommit;version=$productVersion; sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant(); publisher=$cert.Thumbprint} | ConvertTo-Json -Compress
