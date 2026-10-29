[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$ApplicationRoot)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'PlatformTlsOperations.psm1') -Force
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('bioems-rotation-' + [guid]::NewGuid().ToString('N'))
$config = Join-Path $temporary 'config'
New-Item -ItemType Directory -Path $config -Force | Out-Null
$process = $null
$old = $null
$new = $null
try {
    $secret = [guid]::NewGuid().ToString('N')
    $password = ConvertTo-SecureString $secret -AsPlainText -Force
    $old = & (Join-Path $PSScriptRoot 'New-PlatformTlsCertificate.ps1') -PfxPath (Join-Path $config 'bioems-local.pfx') -PublicCertificatePath (Join-Path $config 'bioems-local.cer') -Password $password -DnsNames @('localhost') -IpAddresses @('127.0.0.1','::1')
    $new = & (Join-Path $PSScriptRoot 'New-PlatformTlsCertificate.ps1') -PfxPath (Join-Path $temporary 'next.pfx') -PublicCertificatePath (Join-Path $temporary 'next.cer') -Password $password -DnsNames @('localhost') -IpAddresses @('127.0.0.1','::1')
    [IO.File]::WriteAllText((Join-Path $config 'backend.env'),"BIOEMS_TLS_PFX_PATH=$($old.pfxPath)`nBIOEMS_TLS_PFX_PASSPHRASE=$secret`n")
    [IO.File]::WriteAllText((Join-Path $config 'tls-certificate.json'),'{"schemaVersion":1,"thumbprint":"test-original"}')
    $originalEnvHash = (Get-FileHash -LiteralPath (Join-Path $config 'backend.env')).Hash
    $originalPfxHash = (Get-FileHash -LiteralPath $old.pfxPath).Hash
    $originalPublicHash = (Get-FileHash -LiteralPath $old.publicCertificatePath).Hash
    $originalAcl = (Get-Acl -LiteralPath $old.pfxPath).Sddl
    $listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,0)
    $listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop()
    $state = @{ server=$null; startAttempts=0 }
    $serverScript = Join-Path $PSScriptRoot 'Test-TlsOperationsServer.cjs'
    $stop = { if ($state.server -and -not $state.server.HasExited) { $state.server.Kill(); $state.server.WaitForExit() } }.GetNewClosure()
    $start = {
        $info = New-Object Diagnostics.ProcessStartInfo
        $info.FileName = 'node.exe'
        $info.Arguments = '"' + $serverScript + '"'
        $info.UseShellExecute = $false; $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
        $info.EnvironmentVariables['BIOEMS_TEST_SERVER_PFX'] = $old.pfxPath
        $info.EnvironmentVariables['BIOEMS_TEST_SERVER_PASSWORD'] = $secret
        $info.EnvironmentVariables['BIOEMS_TEST_SERVER_PORT'] = [string]$port
        $state.server = [Diagnostics.Process]::Start($info)
        if ($state.server.StandardOutput.ReadLine() -ne 'READY') { throw 'Test TLS server failed to start' }
    }.GetNewClosure()
    & $start
    $url = "https://127.0.0.1:$port"
    $parameters = @{ ApplicationRoot=$ApplicationRoot; PersistentRoot=$temporary; PlatformUrl=$url; CandidatePfx=$new.pfxPath; CandidatePassword=$password; BackupParent=$temporary; StopServices=$stop; StartServices=$start; CheckServices={} }
    $result = Invoke-BioemsTlsRotation @parameters
    if ($result.state -ne 'SERVER_ACTIVATED_CONTROLLERS_REQUIRE_TRUST_ROLLOUT') { throw 'Activation did not complete' }
    if ((Get-FileHash -LiteralPath $old.publicCertificatePath).Hash -eq $originalPublicHash) { throw 'Candidate was not activated' }
    if ((Get-FileHash -LiteralPath (Join-Path $config 'backend.env')).Hash -ne $originalEnvHash) { throw 'Rotation changed protected environment contents' }
    if ((Get-Acl -LiteralPath $old.pfxPath).Sddl -ne $originalAcl) { throw 'Rotation changed the installed certificate security descriptor' }
    # A service-start failure must restore both files and metadata without losing the snapshot.
    $beforeFailure = (Get-FileHash -LiteralPath $old.pfxPath).Hash
    $parameters.CandidatePfx = Join-Path (Split-Path $result.receiptPath) 'previous.pfx'
    $state.startAttempts = 0
    $parameters.StartServices = { $state.startAttempts++; if ($state.startAttempts -eq 1) { throw 'Injected startup failure' }; & $start }.GetNewClosure()
    $failed = $false
    try { Invoke-BioemsTlsRotation @parameters | Out-Null } catch { $failed = $true }
    if (-not $failed -or (Get-FileHash -LiteralPath $old.pfxPath).Hash -ne $beforeFailure) { throw 'Failed activation did not restore the working files' }
    Invoke-BioemsCertificateCheck 'node.exe' $ApplicationRoot $old.publicCertificatePath $url -Probe
    $oldCandidate = Join-Path (Split-Path $result.receiptPath) 'previous.pfx'
    $parameters.CandidatePfx = $oldCandidate
    $parameters.StartServices = $start
    Restore-BioemsTlsSnapshot -ApplicationRoot $ApplicationRoot -PersistentRoot $temporary -PlatformUrl $url -SnapshotDirectory (Split-Path $result.receiptPath) -ServiceActions @{ StopServices=$stop; StartServices=$start; CheckServices={} } | Out-Null
    if ((Get-FileHash -LiteralPath $old.publicCertificatePath).Hash -ne $originalPublicHash) { throw 'Previous public identity was not recovered' }
    Write-Host 'TLS rotation, pinned live endpoint, retained environment/ACLs and automatic failure recovery PASS'
} finally {
    if ($state.server -and -not $state.server.HasExited) { $state.server.Kill(); $state.server.WaitForExit() }
    foreach ($certificate in @($old,$new)) {
        if ($certificate) {
            Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.thumbprint)" -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath "Cert:\LocalMachine\Root\$($certificate.thumbprint)" -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
