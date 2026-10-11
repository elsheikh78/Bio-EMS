[CmdletBinding()]
param([string]$ApplicationRoot = 'C:\Program Files\BIO-EMS', [string]$PersistentRoot = 'C:\ProgramData\BIO-EMS')
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$base = 'https://localhost/api/v1'
$node = Join-Path $ApplicationRoot 'runtime\node\node.exe'
$issuer = Join-Path $ApplicationRoot 'backend\dist\src\scripts\issue-admin-recovery-package.js'
$work = Join-Path $env:RUNNER_TEMP ('admin-recovery-' + [Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $work | Out-Null
$trustPath = Join-Path $PersistentRoot 'licensing\manufacturer-admin-recovery-trust.json'
$previousTrust = if (Test-Path -LiteralPath $trustPath) { [IO.File]::ReadAllBytes($trustPath) } else { $null }
$previous = @{}
$values = @{
    BIOEMS_ADMIN_RECOVERY_MODE='generate-key'
    BIOEMS_ADMIN_RECOVERY_PRIVATE_KEY=(Join-Path $work 'private.pem')
    BIOEMS_ADMIN_RECOVERY_PASSPHRASE='CiRecoveryKeyPassphrase2026!'
    BIOEMS_ADMIN_RECOVERY_KEY_ID='ci-admin-recovery-key'
    BIOEMS_ADMIN_RECOVERY_OUTPUT=(Join-Path $work 'trust.json')
    BIOEMS_ADMIN_RECOVERY_REQUEST=(Join-Path $work 'request.json')
}
try {
    foreach ($name in $values.Keys) { $previous[$name]=[Environment]::GetEnvironmentVariable($name,'Process'); [Environment]::SetEnvironmentVariable($name,$values[$name],'Process') }
    & $node $issuer
    if ($LASTEXITCODE -ne 0) { throw 'Installed recovery key generation failed' }
    & (Join-Path $ApplicationRoot 'installer\Install-AdminRecoveryTrust.ps1') -TrustFile $values.BIOEMS_ADMIN_RECOVERY_OUTPUT -ApplicationRoot $ApplicationRoot -PersistentRoot $PersistentRoot
    $request = Invoke-RestMethod "$base/auth/admin-recovery/request" -Method Post -ContentType 'application/json' -Body '{"username":"ci-admin"}'
    if ($request.purpose -ne 'CUSTOMER_ADMIN_RECOVERY_REQUEST' -or $request.username -ne 'ci-admin') { throw 'Recovery request shape failed' }
    [IO.File]::WriteAllText($values.BIOEMS_ADMIN_RECOVERY_REQUEST,($request | ConvertTo-Json -Depth 10),(New-Object Text.UTF8Encoding($false)))
    $env:BIOEMS_ADMIN_RECOVERY_MODE='issue'
    $env:BIOEMS_ADMIN_RECOVERY_OUTPUT=Join-Path $work 'permit.json'
    & $node $issuer
    if ($LASTEXITCODE -ne 0) { throw 'Installed recovery issuer failed' }
    $permit=Get-Content -LiteralPath $env:BIOEMS_ADMIN_RECOVERY_OUTPUT -Raw
    $tampered=$permit | ConvertFrom-Json; $tampered.claims.username='other-admin'
    $rejected=$false
    try { Invoke-RestMethod "$base/auth/admin-recovery/authorize" -Method Post -ContentType 'application/json' -Body ($tampered | ConvertTo-Json -Depth 10) | Out-Null } catch { if ([int]$_.Exception.Response.StatusCode -eq 400) {$rejected=$true} else {throw} }
    if (-not $rejected) { throw 'Tampered recovery permit was accepted' }
    $grant=Invoke-RestMethod "$base/auth/admin-recovery/authorize" -Method Post -ContentType 'application/json' -Body $permit
    if ($grant.access_token -or -not $grant.recoveryToken) { throw 'Recovery incorrectly returned a login token' }
    $complete=Invoke-RestMethod "$base/auth/admin-recovery/complete" -Method Post -ContentType 'application/json' -Body (@{recoveryToken=$grant.recoveryToken;newPassword='CiAdminRecovered2026'} | ConvertTo-Json)
    if (-not $complete.success) { throw 'Recovery completion failed' }
    $replayRejected=$false
    try { Invoke-RestMethod "$base/auth/admin-recovery/authorize" -Method Post -ContentType 'application/json' -Body $permit | Out-Null } catch { if ([int]$_.Exception.Response.StatusCode -eq 400) {$replayRejected=$true} else {throw} }
    if (-not $replayRejected) { throw 'Consumed recovery permit replay was accepted' }
    $login=Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body '{"username":"ci-admin","password":"CiAdminRecovered2026"}'
    if (-not $login.access_token -or $login.user.role -ne 'ADMIN') { throw 'Recovered ADMIN login failed' }
    # Restore the CI account for existing update and reinstall qualification steps.
    Invoke-RestMethod "$base/auth/change-password" -Method Post -Headers @{Authorization="Bearer $($login.access_token)"} -ContentType 'application/json' -Body '{"current_password":"CiAdminRecovered2026","new_password":"CiAdminPilot2026"}' | Out-Null
    Write-Host 'Installed offline ADMIN recovery round trip: PASS (tamper/replay rejected; no authenticated session issued by recovery)'
} finally {
    if ($null -ne $previousTrust) { [IO.File]::WriteAllBytes($trustPath,$previousTrust) } else { Remove-Item -LiteralPath $trustPath -Force -ErrorAction SilentlyContinue }
    foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name,$previous[$name],'Process') }
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
