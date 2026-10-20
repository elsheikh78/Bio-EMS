[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$RepositoryRoot)
$ErrorActionPreference = "Stop"
$header = Join-Path $RepositoryRoot "firmware/site-controller-esp32s3/main/bioems_version.h"
$text = Get-Content -LiteralPath $header -Raw
function Read-Define([string]$Name, [string]$Pattern) {
    $matches = [regex]::Matches($text, ('(?m)^#define\s+' + $Name + '\s+' + $Pattern + '\s*$'))
    if ($matches.Count -ne 1) { throw "Invalid or missing firmware contract define: $Name" }
    return $matches[0].Groups[1].Value
}
[pscustomobject]@{
    firmwareVersion = Read-Define 'BIOEMS_FIRMWARE_VERSION' '"([0-9]+\.[0-9]+\.[0-9]+-pilot\.[0-9]+)"'
    protocolVersion = Read-Define 'BIOEMS_PROTOCOL_VERSION' '"([0-9]+\.[0-9]+)"'
    bindingSchemaVersion = [int](Read-Define 'BIOEMS_BINDING_SCHEMA_VERSION' '([0-9]+)')
}
