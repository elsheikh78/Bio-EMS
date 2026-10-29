[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$temporary = Join-Path ([IO.Path]::GetTempPath()) ("bioems-tls-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temporary | Out-Null
$certificate = $null
try {
    $password = ConvertTo-SecureString ([Guid]::NewGuid().ToString('N')) -AsPlainText -Force
    $certificate = & (Join-Path $PSScriptRoot 'New-PlatformTlsCertificate.ps1') -PfxPath (Join-Path $temporary 'candidate.pfx') -PublicCertificatePath (Join-Path $temporary 'candidate.cer') -Password $password -DnsNames @('localhost','ems.example.test') -IpAddresses @('192.0.2.20','127.0.0.1','::1')
    if ($certificate.activated) { throw 'Certificate preparation activated a certificate' }
    $env:BIOEMS_TEST_TLS_CERT = $certificate.publicCertificatePath
    & node (Join-Path $PSScriptRoot 'Test-PlatformTlsCertificateIdentity.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Generated Windows certificate failed native X509 DNS/IP validation' }
    $refused = $false
    try { & (Join-Path $PSScriptRoot 'New-PlatformTlsCertificate.ps1') -PfxPath $certificate.pfxPath -PublicCertificatePath $certificate.publicCertificatePath -Password $password -DnsNames @('ems.example.test') -IpAddresses @('192.0.2.20') | Out-Null } catch { $refused = $true }
    if (-not $refused) { throw 'Existing certificate overwrite was accepted' }
    $refused = $false
    try { & (Join-Path $PSScriptRoot 'Get-PlatformTlsCertificateParameters.ps1') -DnsNames @('ems.example.test&IPAddress=203.0.113.1') -IpAddresses @('192.0.2.20') | Out-Null } catch { $refused = $true }
    if (-not $refused) { throw 'SAN extension injection was accepted' }
    Write-Host 'Windows TLS certificate DNS/IP identity and non-overwrite contract PASS'
} finally {
    Remove-Item Env:\BIOEMS_TEST_TLS_CERT -ErrorAction SilentlyContinue
    if ($certificate) { Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.thumbprint)" -Force -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
