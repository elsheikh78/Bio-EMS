[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot
)

$ErrorActionPreference = "Stop"
$checks = [ordered]@{}
foreach ($serviceId in @("BIOEMS-MQTT", "BIOEMS-InfluxDB", "BIOEMS-Backend")) {
    $checks["service:$serviceId"] = (Get-Service -Name $serviceId -ErrorAction Stop).Status -eq "Running"
}
try {
    $backend = Invoke-RestMethod -Uri "https://localhost/api/v1/health" -TimeoutSec 10
    $checks["backend:https"] = $backend.status -eq "UP"
} catch { $checks["backend:https"] = $false }
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
$checks["licensing:identity"] = Test-Path -LiteralPath (Join-Path $PersistentRoot "licensing\installation-identity.json") -PathType Leaf
$checks["licensing:receipt"] = Test-Path -LiteralPath (Join-Path $PersistentRoot "licensing\installation-provisioning-receipt.json") -PathType Leaf
$checks["firewall:https-only"] = @(Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue).Count -eq 1

$passed = -not ($checks.Values -contains $false)
$evidence = [ordered]@{ schemaVersion = 1; status = $(if ($passed) { "PASS" } else { "FAIL" }); checkedAt = (Get-Date).ToUniversalTime().ToString("o"); checks = $checks }
$evidencePath = Join-Path $PersistentRoot "logs\post-install-health.json"
[IO.File]::WriteAllText($evidencePath, ($evidence | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding($false)))
if (-not $passed) { throw "BIO-EMS post-install health gate failed" }
Write-Host "BIO-EMS post-install health: PASS"
