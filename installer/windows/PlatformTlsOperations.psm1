Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:ServiceNames = @('BIOEMS-Provisioner','BIOEMS-Backend')

function Get-BioemsEnvironmentValue([string]$Text, [string]$Name) {
    $matches = [regex]::Matches($Text, '(?m)^' + [regex]::Escape($Name) + '=([^\r\n]*)\r?$')
    if ($matches.Count -ne 1) { throw "Missing or duplicate protected setting: $Name" }
    $value = $matches[0].Groups[1].Value.Trim()
    if (-not $value -or $value.StartsWith('"') -or $value.StartsWith("'")) { throw "Unsupported protected setting format: $Name" }
    return $value
}
function New-BioemsPrivateDirectory([string]$Parent) {
    if (-not (Test-Path -LiteralPath $Parent -PathType Container)) { throw 'An existing protected backup parent is required' }
    $path = Join-Path ([IO.Path]::GetFullPath($Parent)) ('tls-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $path | Out-Null
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18','S-1-5-32-544')) {
        $identity = New-Object Security.Principal.SecurityIdentifier($sid)
        $rule = New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $path -AclObject $acl
    return $path
}
function Invoke-BioemsCertificateCheck([string]$Node, [string]$ApplicationRoot, [string]$CertificatePath, [string]$PlatformUrl, [switch]$Probe) {
    $operation = 'validate'
    if ($Probe) { $operation = 'probe' }
    $attemptLimit = 1
    if ($Probe) { $attemptLimit = 3 }
    for ($attempt = 0; $attempt -lt $attemptLimit; $attempt++) {
        & $Node (Join-Path $PSScriptRoot 'Test-PlatformTlsEndpoint.cjs') $operation $ApplicationRoot $CertificatePath $PlatformUrl
        if ($LASTEXITCODE -eq 0) { return }
        if ($attempt + 1 -lt $attemptLimit) { Start-Sleep -Seconds 2 }
    }
    throw 'TLS certificate identity or live endpoint verification failed'
}
function Get-BioemsTlsPaths([string]$PersistentRoot) {
    $config = Join-Path ([IO.Path]::GetFullPath($PersistentRoot)) 'config'
    $text = [IO.File]::ReadAllText((Join-Path $config 'backend.env'))
    $pfx = [IO.Path]::GetFullPath((Get-BioemsEnvironmentValue $text 'BIOEMS_TLS_PFX_PATH'))
    if ((Split-Path $pfx) -ne $config) { throw 'TLS PFX must be in the protected installation config directory' }
    $public = Join-Path $config 'bioems-local.cer'
    if (-not (Test-Path -LiteralPath $pfx -PathType Leaf) -or -not (Test-Path -LiteralPath $public -PathType Leaf)) { throw 'Installed certificate files are missing' }
    return @{ Pfx = $pfx; Public = $public; Password = (Get-BioemsEnvironmentValue $text 'BIOEMS_TLS_PFX_PASSPHRASE'); Metadata = (Join-Path $config 'tls-certificate.json') }
}
function Invoke-BioemsTlsRotation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$ApplicationRoot,
        [Parameter(Mandatory=$true)][string]$PersistentRoot,
        [Parameter(Mandatory=$true)][string]$PlatformUrl,
        [Parameter(Mandatory=$true)][string]$CandidatePfx,
        [Parameter(Mandatory=$true)][Security.SecureString]$CandidatePassword,
        [Parameter(Mandatory=$true)][string]$BackupParent,
        [string]$Node = 'node.exe',
        [scriptblock]$StopServices = { foreach ($name in $script:ServiceNames) { Stop-Service -Name $name -ErrorAction Stop } },
        [scriptblock]$StartServices = { foreach ($name in @('BIOEMS-Backend','BIOEMS-Provisioner')) { Start-Service -Name $name -ErrorAction Stop } },
        [scriptblock]$CheckServices = { foreach ($name in $script:ServiceNames) { if ((Get-Service -Name $name).Status -ne 'Running') { throw 'Both platform services must be running before rotation' } } }
    )
    $backupPath = [IO.Path]::GetFullPath($BackupParent) + [IO.Path]::DirectorySeparatorChar
    $applicationPath = [IO.Path]::GetFullPath($ApplicationRoot) + [IO.Path]::DirectorySeparatorChar
    if ($backupPath.StartsWith($applicationPath,[StringComparison]::OrdinalIgnoreCase)) { throw 'Certificate backups must be outside the application/source directory' }
    $paths = Get-BioemsTlsPaths $PersistentRoot
    $candidate = [IO.Path]::GetFullPath($CandidatePfx)
    if ($candidate -eq $paths.Pfx) { throw 'Candidate must be separate from the installed PFX' }
    $certificate = $null
    $snapshot = $null
    $addedTrust = $false
    try {
        $flags = [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable -bor [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet
        $certificate = New-Object Security.Cryptography.X509Certificates.X509Certificate2($candidate,$CandidatePassword,$flags)
        if (-not $certificate.HasPrivateKey) { throw 'Candidate PFX has no private key' }
        & $CheckServices
        $snapshot = New-BioemsPrivateDirectory $BackupParent
        $publicCandidate = Join-Path $snapshot 'candidate.cer'
        [IO.File]::WriteAllBytes($publicCandidate,$certificate.RawData)
        Invoke-BioemsCertificateCheck $Node $ApplicationRoot $publicCandidate $PlatformUrl
        # Re-export with the existing service passphrase; backend.env is never rewritten.
        $replacement = $certificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Pfx,$paths.Password)
        Copy-Item -LiteralPath $paths.Pfx -Destination (Join-Path $snapshot 'previous.pfx')
        Copy-Item -LiteralPath $paths.Public -Destination (Join-Path $snapshot 'previous.cer')
        if (Test-Path -LiteralPath $paths.Metadata) { Copy-Item -LiteralPath $paths.Metadata -Destination (Join-Path $snapshot 'previous-metadata.json') }
        $receiptPath = Join-Path $snapshot 'receipt.json'
        $receipt = [ordered]@{ schema = 1; utc = [DateTime]::UtcNow.ToString('o'); platformOrigin = ([uri]$PlatformUrl).GetLeftPart([UriPartial]::Authority); persistentRoot = [IO.Path]::GetFullPath($PersistentRoot); previousPfxSha256 = (Get-FileHash -LiteralPath $paths.Pfx -Algorithm SHA256).Hash; previousPublicSha256 = (Get-FileHash -LiteralPath $paths.Public -Algorithm SHA256).Hash; candidatePublicSha256 = (Get-FileHash -LiteralPath $publicCandidate -Algorithm SHA256).Hash; state = 'BACKED_UP'; controllersUpdated = $false }
        $receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
        try {
            & $StopServices
            if (-not (Test-Path -LiteralPath "Cert:\LocalMachine\Root\$($certificate.Thumbprint)")) {
                Import-Certificate -FilePath $publicCandidate -CertStoreLocation 'Cert:\LocalMachine\Root' | Out-Null
                $addedTrust = $true
            }
            [IO.File]::WriteAllBytes($paths.Pfx,$replacement)
            [IO.File]::WriteAllBytes($paths.Public,$certificate.RawData)
            [IO.File]::WriteAllText($paths.Metadata, (([ordered]@{ schemaVersion = 1; thumbprint = $certificate.Thumbprint }) | ConvertTo-Json), (New-Object Text.UTF8Encoding($false)))
            & $StartServices
            Invoke-BioemsCertificateCheck $Node $ApplicationRoot $paths.Public $PlatformUrl -Probe
            $receipt.state = 'SERVER_ACTIVATED_CONTROLLERS_REQUIRE_TRUST_ROLLOUT'
            $receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
        } catch {
            try {
                & $StopServices
                [IO.File]::WriteAllBytes($paths.Pfx,[IO.File]::ReadAllBytes((Join-Path $snapshot 'previous.pfx')))
                [IO.File]::WriteAllBytes($paths.Public,[IO.File]::ReadAllBytes((Join-Path $snapshot 'previous.cer')))
                if (Test-Path -LiteralPath (Join-Path $snapshot 'previous-metadata.json')) { [IO.File]::WriteAllBytes($paths.Metadata,[IO.File]::ReadAllBytes((Join-Path $snapshot 'previous-metadata.json'))) }
                if ($addedTrust) { Remove-Item -LiteralPath "Cert:\LocalMachine\Root\$($certificate.Thumbprint)" -Force }
                & $StartServices
                $receipt.state = 'ACTIVATION_FAILED_FILES_RESTORED_VERIFY_PREVIOUS_ENDPOINT'
            } catch { $receipt.state = 'RECOVERY_REQUIRED_SERVICES_OR_FILES_UNKNOWN' }
            $receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
            throw "TLS activation failed; inspect protected receipt at $receiptPath. $($receipt.state)"
        }
        return [pscustomobject]@{ receiptPath = $receiptPath; state = $receipt.state; controllersUpdated = $false }
    } finally { if ($certificate) { $certificate.Dispose() } }
}
function Restore-BioemsTlsSnapshot {
    [CmdletBinding()]
    param([string]$ApplicationRoot,[string]$PersistentRoot,[string]$PlatformUrl,[string]$SnapshotDirectory,[string]$Node = 'node.exe',[hashtable]$ServiceActions=@{})
    $snapshot = [IO.Path]::GetFullPath($SnapshotDirectory)
    $receipt = Get-Content -LiteralPath (Join-Path $snapshot 'receipt.json') -Raw | ConvertFrom-Json
    $paths = Get-BioemsTlsPaths $PersistentRoot
    if ($receipt.persistentRoot -ne [IO.Path]::GetFullPath($PersistentRoot) -or $receipt.candidatePublicSha256 -ne (Get-FileHash -LiteralPath $paths.Public -Algorithm SHA256).Hash) { throw 'Snapshot does not match the currently installed identity' }
    foreach ($entry in @(@('previous.pfx',$receipt.previousPfxSha256),@('previous.cer',$receipt.previousPublicSha256))) {
        if ((Get-FileHash -LiteralPath (Join-Path $snapshot $entry[0]) -Algorithm SHA256).Hash -ne $entry[1]) { throw 'Snapshot checksum mismatch' }
    }
    $password = ConvertTo-SecureString $paths.Password -AsPlainText -Force
    $options = @{ ApplicationRoot=$ApplicationRoot; PersistentRoot=$PersistentRoot; PlatformUrl=$PlatformUrl; CandidatePfx=(Join-Path $snapshot 'previous.pfx'); CandidatePassword=$password; BackupParent=$snapshot; Node=$Node }
    foreach ($name in $ServiceActions.Keys) {
        if ($name -notin @('StopServices','StartServices','CheckServices') -or $ServiceActions[$name] -isnot [scriptblock]) { throw 'Invalid service callback' }
        $options[$name] = $ServiceActions[$name]
    }
    Invoke-BioemsTlsRotation @options
}
Export-ModuleMember -Function Restore-BioemsTlsSnapshot, Get-BioemsEnvironmentValue,New-BioemsPrivateDirectory,Get-BioemsTlsPaths,Invoke-BioemsCertificateCheck,Invoke-BioemsTlsRotation
