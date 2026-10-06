[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [switch]$PilotMode
)

$ErrorActionPreference = "Stop"
$checks = [ordered]@{}
foreach ($serviceId in @("BIOEMS-MQTT", "BIOEMS-InfluxDB", "BIOEMS-Provisioner", "BIOEMS-Backend", "BIOEMS-RestoreWorker")) {
    $checks["service:$serviceId"] = (Get-Service -Name $serviceId -ErrorAction Stop).Status -eq "Running"
}
try {
    $backend = Invoke-RestMethod -Uri "https://localhost/api/v1/health" -TimeoutSec 10
    $checks["backend:https"] = $backend.status -eq "UP"
} catch { $checks["backend:https"] = $false }

$publicCertificate = Join-Path $PersistentRoot "config\bioems-local.cer"
$checks["device-tls:certificate"] = (
    (Test-Path -LiteralPath $publicCertificate -PathType Leaf) -and
    (Get-Item -LiteralPath $publicCertificate).Length -ge 100
)
try {
    Invoke-WebRequest -Uri "https://localhost/api/v1/device-telemetry/00000000-0000-4000-8000-000000000000" `
        -Method Post -Headers @{ "x-bioems-device-token" = ('a' * 64) } `
        -ContentType "application/json" -Body '{"sensors":[{"channel":1,"value":4}]}' `
        -TimeoutSec 10 | Out-Null
    $checks["device-telemetry:auth-required"] = $false
} catch {
    $checks["device-telemetry:auth-required"] = (
        $_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401
    )
}

$backendEnv = Join-Path $PersistentRoot "config\backend.env"
$provisionerToken = $null
if (Test-Path -LiteralPath $backendEnv -PathType Leaf) {
    foreach ($line in [IO.File]::ReadAllLines($backendEnv)) {
        if ($line.StartsWith("BIOEMS_PROVISIONER_TOKEN=", [StringComparison]::Ordinal)) {
            $provisionerToken = $line.Substring("BIOEMS_PROVISIONER_TOKEN=".Length)
            break
        }
    }
}
if ($provisionerToken) {
    try {
        $provisioner = Invoke-RestMethod -Uri "http://127.0.0.1:9444/health" -Headers @{ Authorization = "Bearer $provisionerToken" } -TimeoutSec 10
        $checks["provisioner:loopback"] = (
            $provisioner.status -eq "UP" -and
            $provisioner.target -eq "ESP32-S3" -and
            $provisioner.esptoolReady -eq $true -and
            $provisioner.firmwareReady -eq $true
        )
        $sim = Invoke-RestMethod -Uri "http://127.0.0.1:9444/sim/health" -Headers @{ Authorization = "Bearer $provisionerToken" } -TimeoutSec 10
        $checks["sim:flash-package"] = (
            $sim.toolReady -eq $true -and
            $sim.firmwareReady -eq $true -and
            $sim.firmwareVersion -eq "0.1.0-bench.1"
        )
    } catch { $checks["provisioner:loopback"] = $false; $checks["sim:flash-package"] = $false }
} else {
    $checks["provisioner:loopback"] = $false
    $checks["sim:flash-package"] = $false
}
try {
    $influx = Invoke-RestMethod -Uri "http://127.0.0.1:8086/health" -TimeoutSec 5
    $checks["influxdb:health"] = $influx.status -eq "pass"
} catch { $checks["influxdb:health"] = $false }
$mqttSocket = New-Object Net.Sockets.TcpClient
try {
    $mqttSocket.Connect("127.0.0.1", 1883)
    $checks["mqtt:loopback"] = $mqttSocket.Connected
} catch { $checks["mqtt:loopback"] = $false } finally { $mqttSocket.Dispose() }
$checks["frontend:index"] = Test-Path -LiteralPath (Join-Path $ApplicationRoot "frontend\index.html") -PathType Leaf
if (-not $PilotMode) {
    $checks["licensing:identity"] = Test-Path -LiteralPath (Join-Path $PersistentRoot "licensing\installation-identity.json") -PathType Leaf
    $checks["licensing:receipt"] = Test-Path -LiteralPath (Join-Path $PersistentRoot "licensing\installation-provisioning-receipt.json") -PathType Leaf
}
$checks["firewall:https-only"] = @(Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue).Count -eq 1

$passed = -not ($checks.Values -contains $false)
$evidence = [ordered]@{ schemaVersion = 1; status = $(if ($passed) { "PASS" } else { "FAIL" }); checkedAt = (Get-Date).ToUniversalTime().ToString("o"); checks = $checks }
$evidencePath = Join-Path $PersistentRoot "logs\post-install-health.json"
[IO.File]::WriteAllText($evidencePath, ($evidence | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding($false)))
if (-not $passed) { throw "BIO-EMS post-install health gate failed" }
Write-Host "BIO-EMS post-install health: PASS"
