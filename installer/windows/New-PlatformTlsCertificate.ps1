[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)][string]$PfxPath,
    [Parameter(Mandatory = $true)][string]$PublicCertificatePath,
    [Parameter(Mandatory = $true)][Security.SecureString]$Password,
    [Parameter(Mandatory = $true)][string[]]$DnsNames,
    [Parameter(Mandatory = $true)][string[]]$IpAddresses,
    [ValidateSet('Cert:\CurrentUser\My','Cert:\LocalMachine\My')][string]$CertificateStore = 'Cert:\CurrentUser\My'
)
$ErrorActionPreference = "Stop"
$pfx = [IO.Path]::GetFullPath($PfxPath)
$public = [IO.Path]::GetFullPath($PublicCertificatePath)
if ($pfx -eq $public -or (Test-Path -LiteralPath $pfx) -or (Test-Path -LiteralPath $public)) { throw "Certificate preparation never overwrites an existing file" }
if (-not (Test-Path -LiteralPath (Split-Path $pfx) -PathType Container) -or -not (Test-Path -LiteralPath (Split-Path $public) -PathType Container)) { throw "Use existing access-controlled output directories" }
$parameters = & (Join-Path $PSScriptRoot 'Get-PlatformTlsCertificateParameters.ps1') -DnsNames $DnsNames -IpAddresses $IpAddresses
if (-not $PSCmdlet.ShouldProcess($public, 'Prepare a new TLS certificate without activating it')) { return }
$certificate = $null
try {
    $certificate = New-SelfSignedCertificate @parameters -CertStoreLocation $CertificateStore -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(3)
    Export-PfxCertificate -Cert $certificate -FilePath $pfx -Password $Password -Force | Out-Null
    Export-Certificate -Cert $certificate -FilePath $public -Force | Out-Null
    [pscustomobject]@{ thumbprint = $certificate.Thumbprint; publicCertificateSha256 = (Get-FileHash -LiteralPath $public -Algorithm SHA256).Hash; pfxPath = $pfx; publicCertificatePath = $public; activated = $false }
} catch {
    Remove-Item -LiteralPath $pfx,$public -Force -ErrorAction SilentlyContinue
    if ($certificate) { Remove-Item -LiteralPath "$CertificateStore\$($certificate.Thumbprint)" -Force -ErrorAction SilentlyContinue }
    throw
}
