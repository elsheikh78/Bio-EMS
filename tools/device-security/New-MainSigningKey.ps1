[CmdletBinding(SupportsShouldProcess=$true)]
param([Parameter(Mandatory=$true)][string]$KeyParent,[Parameter(Mandatory=$true)][string]$Owner,[string]$Node='node.exe')
$ErrorActionPreference = 'Stop'
$parent = [IO.Path]::GetFullPath($KeyParent)
if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw 'Specify an existing protected key parent outside the repository' }
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')) + [IO.Path]::DirectorySeparatorChar
if (($parent + [IO.Path]::DirectorySeparatorChar).StartsWith($repository,[StringComparison]::OrdinalIgnoreCase)) { throw 'Production keys must never be generated in the source checkout' }
if (-not $Owner.Trim()) { throw 'Record the actual owner responsible for key custody' }
if (-not $PSCmdlet.ShouldProcess($parent,'Generate an owner-controlled signing key; no device is modified')) { return }
$directory = Join-Path $parent ('main-signing-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $directory | Out-Null
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18','S-1-5-32-544')) {
    $identity = New-Object Security.Principal.SecurityIdentifier($sid)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
    $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $directory -AclObject $acl
& $Node (Join-Path $PSScriptRoot 'generate-signing-key.cjs') $directory $Owner
if ($LASTEXITCODE -ne 0) { throw 'Key generation failed; inspect the protected directory before retrying' }
Write-Host 'No eFuses or devices were changed. Verify encrypted offline backup and recovery before production use.'
