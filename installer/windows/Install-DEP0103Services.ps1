[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot,
    [Parameter(Mandatory = $true)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$ProductVersion
)

$ErrorActionPreference = "Stop"
$application = [System.IO.Path]::GetFullPath($ApplicationRoot)
$persistent = [System.IO.Path]::GetFullPath($PersistentRoot)
$serviceIds = @("BIOEMS-MQTT", "BIOEMS-InfluxDB", "BIOEMS-Backend")
$wrappers = @{}

trap {
    $failure = $_
    $rollbackServiceIds = @($serviceIds)
    [array]::Reverse($rollbackServiceIds)

    foreach ($serviceId in $rollbackServiceIds) {
        Stop-Service -Name $serviceId -Force -ErrorAction SilentlyContinue
        if ($wrappers.ContainsKey($serviceId)) {
            & $wrappers[$serviceId] uninstall 2>$null | Out-Null
        }
    }

    Write-Error ("DEP-01-03 failed: " + $failure.Exception.Message)
    exit 1
}

$principal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent()
)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "DEP-01-03 service installation requires Administrator privileges"
}
foreach ($serviceId in $serviceIds) {
    if (Get-Service -Name $serviceId -ErrorAction SilentlyContinue) {
        throw "Fresh service installation refuses existing BIO-EMS services"
    }
}
if (Get-Service -Name "mosquitto" -ErrorAction SilentlyContinue) {
    throw "Fresh service installation refuses an existing Mosquitto service"
}

function Find-One([string]$root, [string]$name) {
    $matches = @(Get-ChildItem -LiteralPath $root -Filter $name -File -Recurse)
    if ($matches.Count -ne 1) { throw "Expected exactly one $name under controlled runtime" }
    return $matches[0].FullName
}
function Invoke-Controlled([string]$file, [string[]]$arguments) {
    & $file @arguments
    if ($LASTEXITCODE -ne 0) {
        $safeArguments = @($arguments | ForEach-Object {
            if ($_ -match '(?i)(password|passphrase|secret|token)') { '<redacted>' } else { $_ }
        })
        throw "Controlled command failed: executable=$file exitCode=$LASTEXITCODE arguments=$($safeArguments -join ' ')"
    }
}
function New-Secret([int]$bytes = 32) {
    $buffer = New-Object byte[] $bytes
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($buffer)
}
function Write-Utf8([string]$path, [string]$content) {
    [IO.File]::WriteAllText($path, $content, (New-Object Text.UTF8Encoding($false)))
}
function Protect-Path([string]$path, [string]$serviceId, [string]$rights = "(OI)(CI)M") {
    Invoke-Controlled "icacls.exe" @($path, "/inheritance:r")
    Invoke-Controlled "icacls.exe" @($path, "/grant:r", "SYSTEM:F", "Administrators:F", "NT SERVICE\$serviceId`:$rights")
}
function Add-PathAccess([string]$path, [string]$serviceId, [string]$rights) {
    Invoke-Controlled "icacls.exe" @($path, "/grant", "NT SERVICE\$serviceId`:$rights")
}
function New-MosquittoPasswordFile([string]$executable, [string]$path, [string]$username, [string]$password) {
    $temporary = "$path.plain.$([Guid]::NewGuid().ToString('N'))"
    try {
        New-Item -ItemType File -Path $temporary -Force | Out-Null
        Invoke-Controlled "icacls.exe" @($temporary, "/inheritance:r")
        Invoke-Controlled "icacls.exe" @($temporary, "/grant:r", "SYSTEM:F", "Administrators:F")
        Write-Utf8 $temporary "$username`:$password`r`n"
        Invoke-Controlled $executable @("-U", $temporary)
        Move-Item -LiteralPath $temporary -Destination $path -Force
    } finally {
        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
        }
    }
}
function New-ServiceXml(
    [string]$id,
    [string]$executable,
    [string]$arguments,
    [string]$logPath,
    [string[]]$dependencies,
    [hashtable]$environment,
    [string]$preStart
) {
    $settings = New-Object Xml.XmlWriterSettings
    $settings.Indent = $true
    # XmlWriter backed by StringBuilder reports UTF-16 regardless of the requested
    # Encoding. The resulting string is persisted by Write-Utf8, so omit the XML
    # declaration to avoid a declaration/byte-encoding mismatch in WinSW on
    # Windows PowerShell 5.1.
    $settings.OmitXmlDeclaration = $true
    $builder = New-Object Text.StringBuilder
    $writer = [Xml.XmlWriter]::Create($builder, $settings)
    $writer.WriteStartElement("service")
    foreach ($entry in @(@("id", $id), @("name", $id), @("description", "BIO-EMS controlled service"), @("executable", $executable), @("arguments", $arguments), @("startmode", "Automatic"), @("delayedAutoStart", "true"), @("stoptimeout", "30 sec"), @("logpath", $logPath))) {
        $writer.WriteElementString($entry[0], $entry[1])
    }
    foreach ($dependency in $dependencies) { $writer.WriteElementString("depend", $dependency) }
    foreach ($name in ($environment.Keys | Sort-Object)) {
        $writer.WriteStartElement("env"); $writer.WriteAttributeString("name", $name); $writer.WriteAttributeString("value", $environment[$name]); $writer.WriteEndElement()
    }
    if ($preStart) {
        $writer.WriteStartElement("prestart")
        $writer.WriteElementString("executable", "powershell.exe")
        $writer.WriteElementString("arguments", $preStart)
        $writer.WriteEndElement()
    }
    $writer.WriteStartElement("log"); $writer.WriteAttributeString("mode", "roll"); $writer.WriteEndElement()
    $writer.WriteStartElement("onfailure"); $writer.WriteAttributeString("action", "restart"); $writer.WriteAttributeString("delay", "10 sec"); $writer.WriteEndElement()
    $writer.WriteEndElement(); $writer.Dispose()
    return $builder.ToString()
}

$paths = @{
    Config = Join-Path $persistent "config"
    Data = Join-Path $persistent "data"
    Logs = Join-Path $persistent "logs"
    Backups = Join-Path $persistent "backups"
    Licensing = Join-Path $persistent "licensing"
    Services = Join-Path $application "services"
}
foreach ($path in $paths.Values) { New-Item -ItemType Directory -Path $path -Force | Out-Null }

$node = Find-One (Join-Path $application "runtime\node") "node.exe"
$influxd = Find-One (Join-Path $application "runtime\influxdb") "influxd.exe"
$winswSource = Find-One (Join-Path $application "runtime\service-wrapper") "WinSW-x64.exe"
$mosquittoRuntime = Join-Path $application "runtime\mosquitto"
$mosquittoInstaller = Find-One (Join-Path $application "vendor") "mosquitto-*-install-windows-x64.exe"

$process = Start-Process -FilePath $mosquittoInstaller -ArgumentList @("/S", "/D=$mosquittoRuntime") -Wait -PassThru
if ($process.ExitCode -ne 0) { throw "Mosquitto runtime installation failed" }
if (Get-Service -Name "mosquitto" -ErrorAction SilentlyContinue) {
    Stop-Service -Name "mosquitto" -Force -ErrorAction SilentlyContinue
    Invoke-Controlled "sc.exe" @("delete", "mosquitto")
}
$mosquitto = Find-One $mosquittoRuntime "mosquitto.exe"
$mosquittoPasswd = Find-One $mosquittoRuntime "mosquitto_passwd.exe"

$mqttPassword = New-Secret 36
$influxPassword = New-Secret 36
$jwtSecret = New-Secret 48
$platformJwtSecret = New-Secret 48
$tlsPassword = New-Secret 36
$mqttPasswordFile = Join-Path $paths.Config "mosquitto.passwords"
$mqttConfig = Join-Path $paths.Config "mosquitto.conf"
New-MosquittoPasswordFile $mosquittoPasswd $mqttPasswordFile "bioems-backend" $mqttPassword
Write-Utf8 $mqttConfig @"
allow_anonymous false
password_file $mqttPasswordFile
listener 1883 127.0.0.1
persistence true
persistence_location $($paths.Data)\mqtt\
log_dest file $($paths.Logs)\mqtt.log
"@
New-Item -ItemType Directory -Path (Join-Path $paths.Data "mqtt") -Force | Out-Null

foreach ($serviceId in $serviceIds) {
    $wrapper = Join-Path $paths.Services "$serviceId.exe"
    Copy-Item -LiteralPath $winswSource -Destination $wrapper -Force
    $wrappers[$serviceId] = $wrapper
}
$influxData = Join-Path $paths.Data "influxdb"
New-Item -ItemType Directory -Path $influxData -Force | Out-Null
Write-Utf8 (Join-Path $paths.Services "BIOEMS-MQTT.xml") (New-ServiceXml "BIOEMS-MQTT" $mosquitto "-c `"$mqttConfig`"" (Join-Path $paths.Logs "mqtt-service") @() @{} "")
Write-Utf8 (Join-Path $paths.Services "BIOEMS-InfluxDB.xml") (New-ServiceXml "BIOEMS-InfluxDB" $influxd "--bolt-path `"$influxData\influxd.bolt`" --engine-path `"$influxData\engine`"" (Join-Path $paths.Logs "influxdb-service") @() @{} "")

$backendEnv = Join-Path $paths.Config "backend.env"
$tlsPfx = Join-Path $paths.Config "bioems-local.pfx"
$identityPath = Join-Path $paths.Licensing "installation-identity.json"
$receiptPath = Join-Path $paths.Licensing "installation-provisioning-receipt.json"
$preStartScript = Join-Path $application "installer\Invoke-BackendPreStart.ps1"
$provisioningScript = Join-Path $application "backend\dist\scripts\provision-installation-identity.js"
$backendServer = Join-Path $application "backend\dist\scripts\start-windows-service.js"
$preStartArgs = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$preStartScript`" -NodeExecutable `"$node`" -ProvisioningScript `"$provisioningScript`" -IdentityPath `"$identityPath`" -ReceiptPath `"$receiptPath`""
$backendEnvironment = @{ BIOEMS_ENV_FILE = $backendEnv; BIOEMS_INSTALLATION_IDENTITY_PATH = $identityPath; BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH = $receiptPath }
Write-Utf8 (Join-Path $paths.Services "BIOEMS-Backend.xml") (New-ServiceXml "BIOEMS-Backend" $node "`"$backendServer`"" (Join-Path $paths.Logs "backend-service") @("BIOEMS-MQTT", "BIOEMS-InfluxDB") $backendEnvironment $preStartArgs)

foreach ($serviceId in $serviceIds) {
    Invoke-Controlled $wrappers[$serviceId] @("install")
    Invoke-Controlled "sc.exe" @("sidtype", $serviceId, "unrestricted")
    Invoke-Controlled "sc.exe" @("config", $serviceId, "obj=", "NT SERVICE\$serviceId", "password=", "")
}
Protect-Path $paths.Services "BIOEMS-Backend" "(OI)(CI)RX"
Add-PathAccess $paths.Services "BIOEMS-MQTT" "(OI)(CI)RX"
Add-PathAccess $paths.Services "BIOEMS-InfluxDB" "(OI)(CI)RX"
Protect-Path $paths.Config "BIOEMS-Backend"
Add-PathAccess $paths.Config "BIOEMS-MQTT" "RX"
Add-PathAccess $mqttPasswordFile "BIOEMS-MQTT" "R"
Add-PathAccess $mqttConfig "BIOEMS-MQTT" "R"
Protect-Path $paths.Licensing "BIOEMS-Backend"
Protect-Path (Join-Path $paths.Data "mqtt") "BIOEMS-MQTT"
Protect-Path $influxData "BIOEMS-InfluxDB"
Protect-Path $paths.Logs "BIOEMS-Backend"
Add-PathAccess $paths.Logs "BIOEMS-MQTT" "(OI)(CI)M"
Add-PathAccess $paths.Logs "BIOEMS-InfluxDB" "(OI)(CI)M"
Protect-Path $paths.Backups "BIOEMS-Backend"

Start-Service "BIOEMS-MQTT"
Start-Service "BIOEMS-InfluxDB"
$deadline = (Get-Date).AddSeconds(60)
do {
    try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:8086/health" -TimeoutSec 2 } catch { $health = $null }
    if ($health.status -eq "pass") { break }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)
if ($health.status -ne "pass") { throw "InfluxDB local health gate failed" }

$setupBody = @{ username = "bioems-local"; password = $influxPassword; org = "bioems"; bucket = "telemetry"; retentionPeriodSeconds = 0 } | ConvertTo-Json
$setup = Invoke-RestMethod -Uri "http://127.0.0.1:8086/api/v2/setup" -Method Post -ContentType "application/json" -Body $setupBody
if (-not $setup.auth.token) { throw "InfluxDB onboarding did not return a token" }

$secureTlsPassword = ConvertTo-SecureString $tlsPassword -AsPlainText -Force
$certificate = New-SelfSignedCertificate -DnsName @("localhost", $env:COMPUTERNAME) -CertStoreLocation "Cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(3)
Export-PfxCertificate -Cert $certificate -FilePath $tlsPfx -Password $secureTlsPassword -Force | Out-Null
$publicCertificate = Join-Path $paths.Config "bioems-local.cer"
Export-Certificate -Cert $certificate -FilePath $publicCertificate -Force | Out-Null
Import-Certificate -FilePath $publicCertificate -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
Write-Utf8 (Join-Path $paths.Config "tls-certificate.json") (([ordered]@{ schemaVersion = 1; thumbprint = $certificate.Thumbprint }) | ConvertTo-Json)

Write-Utf8 $backendEnv @"
NODE_ENV=production
PORT=443
API_PREFIX=/api/v1
BIOEMS_FRONTEND_ROOT=$application\frontend
BIOEMS_PRODUCT_VERSION=$ProductVersion
BIOEMS_TLS_PFX_PATH=$tlsPfx
BIOEMS_TLS_PFX_PASSPHRASE=$tlsPassword
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_PROTOCOL=mqtt
MQTT_CLIENT_ID=bio-ems-backend
MQTT_USERNAME=bioems-backend
MQTT_PASSWORD=$mqttPassword
MQTT_CLEAN=false
INFLUX_URL=http://127.0.0.1:8086
INFLUX_TOKEN=$($setup.auth.token)
INFLUX_ORG=bioems
INFLUX_BUCKET=telemetry
BIOEMS_JWT_SECRET=$jwtSecret
BIOEMS_PLATFORM_JWT_SECRET=$platformJwtSecret
BIOEMS_CORS_ALLOWED_ORIGINS=https://localhost
BIOEMS_SQLITE_PATH=$($paths.Data)\bioems.db
BIOEMS_SQLITE_BACKUP_DIR=$($paths.Backups)
LOG_LEVEL=info
BIOEMS_LOG_RETENTION_DAYS=90
BIOEMS_SHUTDOWN_GRACE_SECONDS=30
BIOEMS_NOTIFICATION_DELIVERY_ENABLED=false
"@
Protect-Path $backendEnv "BIOEMS-Backend" "R"
Add-PathAccess $tlsPfx "BIOEMS-Backend" "R"
if (Get-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -ErrorAction SilentlyContinue) { throw "BIO-EMS firewall rule already exists" }
New-NetFirewallRule -DisplayName "BIO-EMS HTTPS" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Domain,Private -RemoteAddress LocalSubnet | Out-Null
Start-Service "BIOEMS-Backend"

$receiptDeadline = (Get-Date).AddSeconds(45)
while (-not (Test-Path -LiteralPath $receiptPath -PathType Leaf) -and (Get-Date) -lt $receiptDeadline) { Start-Sleep -Seconds 1 }
if (-not (Test-Path -LiteralPath $receiptPath -PathType Leaf)) { throw "LIC-11 service-identity provisioning evidence was not created" }
Write-Host "DEP-01-03 Windows service lifecycle: PASS"
