$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'VendorDownload.psm1') -Force
$directory=Join-Path ([IO.Path]::GetTempPath()) ('bioems-vendor-test-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $directory | Out-Null
try {
    $good=Join-Path $directory 'known.bin'; [IO.File]::WriteAllText($good,'synthetic vendor fixture')
    $expected=(Get-FileHash -LiteralPath $good -Algorithm SHA256).Hash
    $target=Join-Path $directory 'download.bin'
    $state=@{ attempts=0 }
    $download={ param($Uri,$Path) $state.attempts++; if ($state.attempts -eq 1) { [IO.File]::WriteAllText($Path,'partial'); throw 'Injected connection reset' }; Copy-Item -LiteralPath $good -Destination $Path }.GetNewClosure()
    Get-VerifiedVendorInput -Source 'https://example.invalid/fixture' -Target $target -Sha256 $expected -Download $download -RetryDelaySeconds 0
    if ($state.attempts -ne 2 -or (Get-FileHash -LiteralPath $target).Hash -ne $expected) { throw 'Transient failure recovery did not validate the final file' }
    Get-VerifiedVendorInput -Source 'https://example.invalid/fixture' -Target $target -Sha256 $expected -Download { throw 'Cache hit unexpectedly downloaded' }
    Remove-Item -LiteralPath $target
    $state.attempts=0
    $tampered={ param($Uri,$Path) $state.attempts++; [IO.File]::WriteAllText($Path,'tampered') }.GetNewClosure()
    $rejected=$false
    try { Get-VerifiedVendorInput -Source 'https://example.invalid/fixture' -Target $target -Sha256 $expected -Download $tampered -RetryDelaySeconds 0 } catch { $rejected=$true }
    if (-not $rejected -or $state.attempts -ne 1 -or (Test-Path -LiteralPath $target)) { throw 'Hash mismatch was retried or published' }
    if (@(Get-ChildItem -LiteralPath $directory -Filter '*.download.*').Count) { throw 'Temporary download was not cleaned up' }
    Write-Host 'Bounded transient retry, verified cache reuse, hash rejection and temporary cleanup PASS'
} finally { Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue }
