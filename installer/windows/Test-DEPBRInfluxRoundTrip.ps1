param(
    [Parameter(Mandatory = $true)][string]$ApplicationRoot,
    [Parameter(Mandatory = $true)][string]$PersistentRoot
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PersistentRoot "config\backend.env"
$influx = Join-Path $ApplicationRoot "runtime\influx-cli\influx.exe"
$backupScript = Join-Path $ApplicationRoot "installer\Invoke-PlatformInfluxBackup.ps1"

foreach ($requiredPath in @($envFile, $influx, $backupScript)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required installed file is missing: $requiredPath"
    }
}

$settings = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $settings[$matches[1]] = $matches[2]
    }
}
foreach ($name in @("INFLUX_URL", "INFLUX_TOKEN", "INFLUX_ORG", "INFLUX_BUCKET")) {
    if (-not $settings[$name]) { throw "Installed Influx setting is missing: $name" }
}

$env:INFLUX_TOKEN = $settings.INFLUX_TOKEN
$env:INFLUX_HOST = $settings.INFLUX_URL
$env:INFLUX_ORG = $settings.INFLUX_ORG
$bucket = $settings.INFLUX_BUCKET
$marker = "depbr_$([Guid]::NewGuid().ToString('N'))"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$queryFile = Join-Path $env:TEMP "depbr-query-$([Guid]::NewGuid().ToString('N')).flux"
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
$query = "from(bucket: `"$bucket`") |> range(start: -10m) |> filter(fn: (r) => r._measurement == `"$marker`") |> count()"
[System.IO.File]::WriteAllText($queryFile, $query, $utf8WithoutBom)
$backup = Join-Path $env:TEMP "depbr-influx-$([Guid]::NewGuid().ToString('N'))"

try {
    $lineProtocolFile = Join-Path $env:TEMP "depbr-line-protocol-$([Guid]::NewGuid().ToString('N')).lp"
    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($lineProtocolFile, "$marker,source=windows-ci value=41.25 $timestamp`n", $utf8WithoutBom)
    & $influx write --bucket $bucket --org $settings.INFLUX_ORG --precision s --file $lineProtocolFile
    if ($LASTEXITCODE -ne 0) { throw "Failed to seed historical telemetry marker" }

    $before = & $influx query --org $settings.INFLUX_ORG --raw --file $queryFile
    if ($LASTEXITCODE -ne 0 -or ($before -join "`n") -notmatch $marker) {
        throw "Seeded historical telemetry marker was not queryable"
    }

    & $backupScript -InfluxCli $influx -BackupDirectory $backup -HostUrl $settings.INFLUX_URL -Org $settings.INFLUX_ORG
    if ($LASTEXITCODE -ne 0) { throw "Installed Influx backup helper failed" }

    $predicate = "_measurement=" + [char]34 + $marker + [char]34
    & $influx delete --bucket $bucket --org $settings.INFLUX_ORG --start 1970-01-01T00:00:00Z --stop 2100-01-01T00:00:00Z --predicate $predicate
    if ($LASTEXITCODE -ne 0) { throw "Failed to remove telemetry marker before restore" }

    $deleted = & $influx query --org $settings.INFLUX_ORG --raw --file $queryFile
    if (($deleted -join "`n") -match $marker) { throw "Telemetry marker still exists before restore" }

    Stop-Service BIOEMS-Backend -Force
    & $influx bucket delete --name $bucket --org $settings.INFLUX_ORG
    if ($LASTEXITCODE -ne 0) { throw "Failed to remove existing InfluxDB bucket before restore" }
    & $influx restore $backup
    if ($LASTEXITCODE -ne 0) { throw "InfluxDB restore failed in round-trip acceptance" }
    Start-Service BIOEMS-Backend

    $after = & $influx query --org $settings.INFLUX_ORG --raw --file $queryFile
    if ($LASTEXITCODE -ne 0 -or ($after -join "`n") -notmatch $marker) {
        throw "Historical telemetry marker was not recovered by restore"
    }
    Write-Host "DEP-BR installed Influx historical telemetry round-trip: PASS"
}
finally {
    if ((Get-Service BIOEMS-Backend -ErrorAction SilentlyContinue).Status -ne "Running") {
        Start-Service BIOEMS-Backend -ErrorAction SilentlyContinue
    }
    Remove-Item Env:INFLUX_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:INFLUX_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:INFLUX_ORG -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction SilentlyContinue
    if ($lineProtocolFile) { Remove-Item -LiteralPath $lineProtocolFile -Force -ErrorAction SilentlyContinue }
    if ($queryFile) { Remove-Item -LiteralPath $queryFile -Force -ErrorAction SilentlyContinue }
}
