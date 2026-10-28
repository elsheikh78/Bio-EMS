[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [Parameter(Mandatory=$true)][string]$ApplicationRoot,
    [Parameter(Mandatory=$true)][ValidatePattern('^COM[1-9][0-9]*$')][string]$Port,
    [Parameter(Mandatory=$true)][ValidatePattern('^[A-Fa-f0-9]{12,32}$')][string]$HardwareUid,
    [Parameter(Mandatory=$true)][string]$PublicCertificatePath,
    [Parameter(Mandatory=$true)][string]$PlatformUrl,
    [string]$Node='node.exe'
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PlatformTlsOperations.psm1') -Force
Invoke-BioemsCertificateCheck $Node $ApplicationRoot $PublicCertificatePath $PlatformUrl -Probe
$bytes = [IO.File]::ReadAllBytes($PublicCertificatePath)
if ($bytes[0] -ne 0x30 -or $bytes.Length -gt 2500) { throw 'Use the validated exported DER certificate' }
$certificate = [Convert]::ToBase64String($bytes)
$origin = ([uri]$PlatformUrl).GetLeftPart([UriPartial]::Authority)
if (-not $PSCmdlet.ShouldProcess($Port,'Update public TLS trust and origin on the exact paired Main; retain binding and credentials')) { return }
$serial = New-Object IO.Ports.SerialPort($Port,115200,[IO.Ports.Parity]::None,8,[IO.Ports.StopBits]::One)
$serial.DtrEnable=$false; $serial.RtsEnable=$false; $serial.ReadTimeout=250; $serial.WriteTimeout=3000
function Read-Window([int]$Milliseconds) {
    $deadline=[DateTime]::UtcNow.AddMilliseconds($Milliseconds)
    $text=New-Object Text.StringBuilder
    while ([DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 50; [void]$text.Append($serial.ReadExisting()) }
    return $text.ToString()
}
function Send-Checked([string]$Command,[string]$Acknowledgement,[int]$Wait=500) {
    $serial.WriteLine($Command)
    if ((Read-Window $Wait) -notmatch [regex]::Escape($Acknowledgement)) { throw 'Main did not acknowledge the trust update; verify board state before continuing' }
}
function Status-Field([string]$Text,[string]$Name) {
    $values=[regex]::Matches($Text,'(?m)^\s*'+[regex]::Escape($Name)+':\s*(\S+)\s*$')
    if ($values.Count -ne 1) { throw "Missing or ambiguous controller field: $Name" }
    return $values[0].Groups[1].Value
}
try {
    $serial.Open(); Start-Sleep -Milliseconds 1800; $serial.DiscardInBuffer()
    $serial.WriteLine('status'); $before=Read-Window 2000
    if ((Status-Field $before 'hardware-uid') -ne $HardwareUid -or (Status-Field $before 'state') -ne 'PAIRED') { throw 'Exact paired hardware identity was not verified; no trust was written' }
    $binding=@{}
    foreach ($field in @('platform-binding-id','installation-id','device-id')) { $binding[$field]=Status-Field $before $field }
    Send-Checked 'cabegin' 'certificate transfer started'
    $chunkBytes=160
    for ($offset=0; $offset -lt $certificate.Length; $offset+=$chunkBytes) {
        $count=[Math]::Min($chunkBytes,$certificate.Length-$offset)
        Send-Checked ('cachunk '+$certificate.Substring($offset,$count)) 'certificate chunk saved' 300
    }
    Send-Checked 'caend' 'platform certificate saved' 750
    Send-Checked ('setplatform '+$origin) 'platform url saved' 1000
    Send-Checked ('settime '+[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) 'UTC time saved' 750
    $serial.WriteLine('status'); $after=Read-Window 2000
    if ((Status-Field $after 'hardware-uid') -ne $HardwareUid -or (Status-Field $after 'state') -ne 'PAIRED') { throw 'Main identity/state changed; inspect before resuming service' }
    foreach ($field in $binding.Keys) { if ((Status-Field $after $field) -ne $binding[$field]) { throw 'Binding changed unexpectedly; stop and inspect' } }
    [pscustomobject]@{ hardwareUid=$HardwareUid; publicCertificateSha256=(Get-FileHash -LiteralPath $PublicCertificatePath -Algorithm SHA256).Hash; platformOrigin=$origin; bindingPreserved=$true; telemetryAcceptance='VERIFY_LIVE_PLATFORM_DELIVERY_AND_QUEUED_REPLAY' }
} finally { if ($serial.IsOpen) { $serial.Close() }; $serial.Dispose() }
