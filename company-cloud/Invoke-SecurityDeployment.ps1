[CmdletBinding()]
param(
    [ValidateSet('inspect','migrate','deploy')][string]$Mode = 'inspect',
    [string]$BackupDirectory,
    [switch]$Login
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'Command failed; deployment stopped' }
}
if (-not (Test-Path 'node_modules\wrangler\bin\wrangler.js')) {
    Invoke-Checked 'npm.cmd' @('ci')
}
if ($Login) { Invoke-Checked 'node.exe' @('node_modules\wrangler\bin\wrangler.js','login') }
if ($Mode -ne 'inspect') {
    if (-not $BackupDirectory) { throw 'Specify a backup directory outside the source checkout' }
    $parent = [IO.Path]::GetFullPath($BackupDirectory)
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'Backup parent directory does not exist' }
    $backup = Join-Path $parent ('bioems-security-' + [guid]::NewGuid().ToString('N'))
    $repository = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot)) + [IO.Path]::DirectorySeparatorChar
    if (($backup + [IO.Path]::DirectorySeparatorChar).StartsWith($repository, [StringComparison]::OrdinalIgnoreCase)) { throw 'Do not store database exports in the source checkout' }
    if (-not (Test-Path -LiteralPath $backup)) { New-Item -ItemType Directory -Path $backup | Out-Null }
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18','S-1-5-32-544')) {
        $identity = New-Object Security.Principal.SecurityIdentifier($sid)
        $rule = New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $backup -AclObject $acl
    if ($Mode -eq 'deploy') {
        Invoke-Checked 'npm.cmd' @('--prefix','..\frontend','ci')
        Invoke-Checked 'npm.cmd' @('test')
        Invoke-Checked 'npm.cmd' @('run','build')
    }
    Invoke-Checked 'node.exe' @('scripts\security-deployment.mjs',$Mode,$backup)
} else { Invoke-Checked 'node.exe' @('scripts\security-deployment.mjs','inspect') }
