$ErrorActionPreference = "Stop"
$reader = Join-Path $PSScriptRoot "Read-ControllerFirmwareContract.ps1"
$temporary = Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid().ToString())
try {
    $folder = Join-Path $temporary "firmware/site-controller-esp32s3/main"
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $header = Join-Path $folder "bioems_version.h"
    foreach ($version in @('0.1.0-pilot.7','0.2.0-pilot.99')) {
        @"
#define BIOEMS_FIRMWARE_VERSION "$version"
#define BIOEMS_PROTOCOL_VERSION "1.3"
#define BIOEMS_BINDING_SCHEMA_VERSION 1
"@ | Set-Content -LiteralPath $header -Encoding ASCII
        $contract = & $reader -RepositoryRoot $temporary
        if ($contract.firmwareVersion -ne $version -or $contract.protocolVersion -ne '1.3' -or $contract.bindingSchemaVersion -ne 1) {
            throw "Firmware contract was not read from its source header"
        }
    }
    Add-Content -LiteralPath $header '#define BIOEMS_FIRMWARE_VERSION "0.1.0-pilot.6"'
    $rejected = $false
    try { & $reader -RepositoryRoot $temporary | Out-Null } catch { $rejected = $true }
    if (-not $rejected) { throw "Duplicate firmware identity was accepted" }
    Write-Host "Firmware header contract: PASS"
} finally {
    Remove-Item -LiteralPath $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
