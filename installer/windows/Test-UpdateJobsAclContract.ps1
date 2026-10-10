$ErrorActionPreference = 'Stop'
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile(
    (Join-Path $PSScriptRoot 'Invoke-DEP0105Lifecycle.ps1'), [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) { throw 'Lifecycle script failed parsing' }
$function = $ast.Find({ param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
    $node.Name -eq 'Initialize-ControlledUpdateJobs'
}, $true)
if (-not $function) { throw 'Update job directory initializer is missing' }
$initialize = $function.Body.GetScriptBlock()
$root = Join-Path $env:RUNNER_TEMP ("bioems-update-acl-" + [Guid]::NewGuid().ToString('N'))
try {
    # A pre-feature installation has no update-jobs directory.
    & $initialize -PersistentRoot $root
    $jobs = Join-Path $root 'update-jobs'
    $marker = Join-Path $jobs 'preserve-marker.txt'
    [IO.File]::WriteAllText($marker, 'existing job data')
    & $initialize -PersistentRoot $root
    if ([IO.File]::ReadAllText($marker) -ne 'existing job data') { throw 'Repair destroyed existing update job data' }
    $acl = Get-Acl -LiteralPath $jobs
    if (-not $acl.AreAccessRulesProtected) { throw 'Update directory inherited untrusted access' }
    $backend = (New-Object Security.Principal.NTAccount('NT SERVICE', 'BIOEMS-Backend')).Translate([Security.Principal.SecurityIdentifier]).Value
    $allowed = @('S-1-5-18', 'S-1-5-32-544', $backend)
    $seen = @()
    foreach ($entry in $acl.Access) {
        $sid = $entry.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
        if ($entry.AccessControlType -ne 'Allow' -or $sid -notin $allowed) { throw 'Update directory allows an unexpected principal' }
        $seen += $sid
    }
    foreach ($sid in $allowed) { if ($sid -notin $seen) { throw 'Update directory is missing a required principal' } }
    Write-Host 'Legacy Repair update directory creation, restricted ACL and idempotent preservation: PASS'
} finally {
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
}
