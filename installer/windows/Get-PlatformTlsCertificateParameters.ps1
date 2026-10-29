[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string[]]$DnsNames,
    [Parameter(Mandatory = $true)][string[]]$IpAddresses
)
$ErrorActionPreference = "Stop"
$names = @($DnsNames | ForEach-Object { $_.Trim().ToLowerInvariant() } | Sort-Object -Unique)
$ips = @($IpAddresses | ForEach-Object {
    $address = $null
    if (-not [Net.IPAddress]::TryParse($_, [ref]$address)) { throw "Invalid certificate IP address" }
    $address.ToString()
} | Sort-Object -Unique)
if ($names.Count -lt 1 -or $names.Count -gt 8 -or $ips.Count -gt 16) { throw "TLS identity set exceeds the controlled certificate limits" }
foreach ($name in $names) {
    if ($name.Length -gt 253 -or $name -notmatch '^[a-z0-9][a-z0-9.-]*$' -or [Uri]::CheckHostName($name) -ne [UriHostNameType]::Dns) { throw "Invalid certificate DNS name" }
    foreach ($label in $name.Split('.')) { if ($label.Length -lt 1 -or $label.Length -gt 63 -or $label.StartsWith('-') -or $label.EndsWith('-')) { throw "Invalid certificate DNS label" } }
}
$san = (@($names | ForEach-Object { "DNS=$_" }) + @($ips | ForEach-Object { "IPAddress=$_" })) -join '&'
if ($san.Length -gt 800) { throw "TLS identity set is too large for the controller certificate buffer" }
@{
    Subject = "CN=$($names[0])"
    Type = "SSLServerAuthentication"
    TextExtension = @("2.5.29.17={text}$san")
}
