$ErrorActionPreference = 'Stop'
$tokens = $null
$errors = $null
$source = Join-Path $PSScriptRoot 'Invoke-DEP0105Lifecycle.ps1'
$ast = [System.Management.Automation.Language.Parser]::ParseFile($source, [ref]$tokens, [ref]$errors)
if ($errors.Count -gt 0) { throw 'Lifecycle script failed parsing' }
# Execute only the real validator, without service or filesystem lifecycle actions.
$function = $ast.Find({ param($node)
    $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
    $node.Name -eq 'Test-ControlledProvisionerToken'
}, $true)
if (-not $function) { throw 'Controlled Provisioner token validator is missing' }
$validate = $function.Body.GetScriptBlock()
$fresh = [Convert]::ToBase64String([byte[]](128..175))
$padded = [Convert]::ToBase64String([byte[]](128..159))
$legacy = 'a1' * 32
foreach ($value in @($fresh, $padded, $legacy)) {
    if (-not (& $validate -Token $value)) { throw 'Repair rejected a supported existing token' }
}
foreach ($value in @('', 'short', ('x' * 33), ($fresh + '!'), ($fresh + "`n"), ($legacy + "`n"), (' ' + $fresh))) {
    if (& $validate -Token $value) { throw 'Repair accepted a malformed or short token' }
}
Write-Host 'Fresh Base64 and legacy hexadecimal Provisioner token validation: PASS'
