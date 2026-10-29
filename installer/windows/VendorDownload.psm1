Set-StrictMode -Version Latest
function Get-VerifiedVendorInput {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][uri]$Source,
        [Parameter(Mandatory=$true)][string]$Target,
        [Parameter(Mandatory=$true)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$Sha256,
        [ValidateRange(1,5)][int]$MaxAttempts=3,
        [ValidateRange(0,30)][int]$RetryDelaySeconds=2,
        [scriptblock]$Download = { param($Uri,$Path) Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Path -TimeoutSec 300 -ErrorAction Stop }
    )
    if ($Source.Scheme -ne 'https' -or $Source.UserInfo) { throw 'Vendor inputs require an HTTPS source without embedded credentials' }
    $expected=$Sha256.ToLowerInvariant()
    if (Test-Path -LiteralPath $Target -PathType Leaf) {
        if ((Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Cached vendor input checksum mismatch; cache retained for inspection' }
        return
    }
    $temporary=$Target+'.download.'+[guid]::NewGuid().ToString('N')
    try {
        for ($attempt=1; $attempt -le $MaxAttempts; $attempt++) {
            try { & $Download $Source $temporary; break } catch {
                Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
                if ($attempt -eq $MaxAttempts) { throw 'Vendor download failed after bounded retries; no cache file was published' }
                Write-Warning "Transient vendor download failure; retry $($attempt+1) of $MaxAttempts"
                Start-Sleep -Seconds $RetryDelaySeconds
            }
        }
        if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Downloaded vendor input checksum mismatch; rejected without retry' }
        Move-Item -LiteralPath $temporary -Destination $Target -ErrorAction Stop
    } finally { Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue }
}
Export-ModuleMember -Function Get-VerifiedVendorInput
