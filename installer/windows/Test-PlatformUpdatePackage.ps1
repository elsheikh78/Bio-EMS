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
$info = $file.VersionInfo
if ($info.ProductName -ne 'BIO-EMS' -or $info.FileDescription -ne 'BIO-EMS Client Setup' -or $info.ProductVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'File is not a BIO-EMS client update' }
[ordered]@{version=$info.ProductVersion; sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant(); publisher=$cert.Thumbprint} | ConvertTo-Json -Compress
