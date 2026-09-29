import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import {
  firmwareManifestSchema,
  windowsSerialPortSchema,
  type FirmwareManifest,
} from "./device-provisioning.schema";

const execFileAsync = promisify(execFile);

type ProcessResult = { stdout: string; stderr: string };
type ProcessExecutor = (
  executable: string,
  args: string[],
  options: { timeout: number; maxBuffer: number; windowsHide: boolean; env?: NodeJS.ProcessEnv }
) => Promise<ProcessResult>;

export interface LocalProvisioningRunnerConfig {
  applicationRoot: string;
  esptoolPath: string;
  firmwareManifestPath?: string;
  tlsCertificatePath?: string;
}

export interface SerialPortInventoryItem {
  port: string;
  name: string | null;
  pnpDeviceId: string | null;
  manufacturer: string | null;
}

export interface SerialProvisioningInput {
  wifiSsid: string;
  wifiPassword: string;
  platformUrl: string;
  pairingCode: string;
}

function normalizedInside(root: string, candidate: string): string {
  const canonicalRoot = realpathSync(root);
  const canonicalCandidate = realpathSync(candidate);
  const rel = relative(canonicalRoot, canonicalCandidate);
  if (rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))) {
    return canonicalCandidate;
  }
  throw new Error("Controlled provisioning path escaped the BIO-EMS application root");
}

function sanitizeToolOutput(value: string): string {
  return value.split(/\r?\n/).filter(Boolean).slice(-40).join("\n").slice(0, 8_000);
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parsePortInventory(stdout: string): SerialPortInventoryItem[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const decoded = JSON.parse(trimmed) as unknown;
  const rows = Array.isArray(decoded) ? decoded : [decoded];
  return rows.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    const parsed = windowsSerialPortSchema.safeParse(row.port);
    if (!parsed.success) return [];
    const optional = (key: string) =>
      typeof row[key] === "string" && row[key] ? String(row[key]) : null;
    return [
      {
        port: parsed.data,
        name: optional("name"),
        pnpDeviceId: optional("pnpDeviceId"),
        manufacturer: optional("manufacturer"),
      },
    ];
  });
}

function inferChip(output: string): string | null {
  if (/ESP32-S3/i.test(output)) return "ESP32-S3";
  const match = output.match(/Chip is\s+([^\r\n(]+)/i);
  return match?.[1]?.trim() ?? null;
}

function provisioningField(output: string, label: string, pattern: string): string {
  const expression = new RegExp("^\\s*" + label + ":\\s*(" + pattern + ")\\s*$", "im");
  const match = output.match(expression);
  if (!match?.[1]) throw new Error("Provisioned controller did not report " + label);
  return match[1];
}

function redactProvisioningOutput(output: string, secrets: string[]): string {
  let redacted = output;
  for (const secret of secrets) {
    if (secret) redacted = redacted.split(secret).join("[REDACTED]");
  }
  return sanitizeToolOutput(redacted);
}

export class LocalProvisioningRunner {
  private readonly execute: ProcessExecutor;

  constructor(
    private readonly config: LocalProvisioningRunnerConfig,
    executor?: ProcessExecutor
  ) {
    this.execute =
      executor ??
      (async (executable, args, options) => {
        const result = await execFileAsync(executable, args, {
          timeout: options.timeout,
          maxBuffer: options.maxBuffer,
          windowsHide: options.windowsHide,
          env: options.env,
          encoding: "utf8",
        });
        return { stdout: result.stdout, stderr: result.stderr };
      });
  }

  health() {
    const firmwareReady = Boolean(
      this.config.firmwareManifestPath && existsSync(this.config.firmwareManifestPath)
    );
    return {
      status: "UP" as const,
      target: "ESP32-S3" as const,
      esptoolReady: existsSync(this.config.esptoolPath),
      firmwareReady,
    };
  }

  async listPorts(): Promise<SerialPortInventoryItem[]> {
    const script = [
      "Get-CimInstance Win32_SerialPort",
      "Select-Object @{n='port';e={$_.DeviceID}},@{n='name';e={$_.Name}},@{n='pnpDeviceId';e={$_.PNPDeviceID}},@{n='manufacturer';e={$_.Manufacturer}}",
      "ConvertTo-Json -Compress",
    ].join(" | ");

    const result = await this.execute(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 10_000, maxBuffer: 256_000, windowsHide: true }
    );
    return parsePortInventory(result.stdout);
  }

  async detect(portInput: string) {
    const port = windowsSerialPortSchema.parse(portInput);
    const esptool = normalizedInside(this.config.applicationRoot, this.config.esptoolPath);
    const result = await this.execute(
      esptool,
      [
        "--chip",
        "esp32s3",
        "--port",
        port,
        "--before",
        "default-reset",
        "--after",
        "hard-reset",
        "chip-id",
      ],
      {
        timeout: 20_000,
        maxBuffer: 512_000,
        windowsHide: true,
        env: { ...process.env, NO_COLOR: "1" },
      }
    );
    const output = `${result.stdout}\n${result.stderr}`;
    const chip = inferChip(output);
    return {
      port,
      chip,
      supported: chip === "ESP32-S3",
      toolOutput: sanitizeToolOutput(output),
    };
  }

  async flash(portInput: string) {
    const port = windowsSerialPortSchema.parse(portInput);
    const manifestPath = this.config.firmwareManifestPath;
    if (!manifestPath || !existsSync(manifestPath)) {
      throw new Error("Controlled BIO-EMS firmware package is not installed");
    }

    const esptool = normalizedInside(this.config.applicationRoot, this.config.esptoolPath);
    const manifestFile = normalizedInside(this.config.applicationRoot, manifestPath);
    const manifest = firmwareManifestSchema.parse(
      JSON.parse(readFileSync(manifestFile, "utf8"))
    ) as FirmwareManifest;
    const firmwareRoot = dirname(manifestFile);

    const segmentArgs: string[] = [];
    for (const segment of manifest.segments) {
      if (isAbsolute(segment.file) || segment.file.includes("..")) {
        throw new Error("Firmware manifest contains an unsafe segment path");
      }
      const path = normalizedInside(
        this.config.applicationRoot,
        resolve(firmwareRoot, segment.file)
      );
      if (sha256(path) !== segment.sha256) {
        throw new Error(`Firmware segment checksum mismatch: ${segment.file}`);
      }
      segmentArgs.push(segment.offset, path);
    }

    const args = [
      "--chip",
      "esp32s3",
      "--port",
      port,
      "--baud",
      String(manifest.flash.baud),
      "--before",
      "default-reset",
      "--after",
      "hard-reset",
      "write-flash",
      "--flash-mode",
      manifest.flash.mode,
      "--flash-freq",
      manifest.flash.frequency,
      "--flash-size",
      manifest.flash.size,
      ...segmentArgs,
    ];
    const result = await this.execute(esptool, args, {
      timeout: 180_000,
      maxBuffer: 2_000_000,
      windowsHide: true,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return {
      port,
      firmwareVersion: manifest.firmwareVersion,
      protocolVersion: manifest.protocolVersion,
      bindingSchemaVersion: manifest.bindingSchemaVersion,
      toolOutput: sanitizeToolOutput(`${result.stdout}\n${result.stderr}`),
    };
  }

  async provision(portInput: string, input: SerialProvisioningInput) {
    const port = windowsSerialPortSchema.parse(portInput);
    const certificatePath = this.config.tlsCertificatePath;
    if (!certificatePath || !existsSync(certificatePath))
      throw new Error("BIO-EMS TLS certificate is not installed for device provisioning");
    const certificate = readFileSync(certificatePath);
    if (certificate.length < 100 || certificate.length > 2500)
      throw new Error("BIO-EMS TLS certificate has invalid length");
    const script = [
      "$ErrorActionPreference='Stop'",
      "$portName=$env:BIOEMS_SERIAL_PORT",
      "$ssid=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:BIOEMS_WIFI_SSID_B64))",
      "$password=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:BIOEMS_WIFI_PASSWORD_B64))",
      "$platformUrl=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:BIOEMS_PLATFORM_URL_B64))",
      "$pairingCode=$env:BIOEMS_PAIRING_CODE",
      "$certificate=$env:BIOEMS_CA_DER_B64",
      "$serial=[System.IO.Ports.SerialPort]::new($portName,115200,[System.IO.Ports.Parity]::None,8,[System.IO.Ports.StopBits]::One)",
      "$serial.NewLine=[Environment]::NewLine",
      "$serial.ReadTimeout=250",
      "$serial.WriteTimeout=3000",
      "function Read-Window([int]$milliseconds) {",
      "  $deadline=[DateTime]::UtcNow.AddMilliseconds($milliseconds)",
      "  $builder=New-Object Text.StringBuilder",
      "  while([DateTime]::UtcNow -lt $deadline) {",
      "    Start-Sleep -Milliseconds 100",
      "    $chunk=$serial.ReadExisting()",
      "    if($chunk){ [void]$builder.Append($chunk) }",
      "  }",
      "  return $builder.ToString()",
      "}",
      "$serial.Open()",
      "try {",
      "  Start-Sleep -Milliseconds 1800",
      "  $serial.DiscardInBuffer()",
      "  $serial.WriteLine('status')",
      "  $initial=Read-Window 2500",
      "  Write-Output $initial",
      "  if($initial -notmatch 'hardware-uid:\\s*[A-Fa-f0-9]{12,32}') { throw 'Hardware UID was not reported' }",
      "  $serial.WriteLine('cabegin')",
      "  if((Read-Window 300) -notmatch 'certificate transfer started') { throw 'Certificate transfer not acknowledged' }",
      "  for($offset=0; $offset -lt $certificate.Length; $offset+=160) {",
      "    $size=[Math]::Min(160,$certificate.Length-$offset)",
      "    $serial.WriteLine('cachunk ' + $certificate.Substring($offset,$size))",
      "    if((Read-Window 300) -notmatch 'certificate chunk saved') { throw 'Certificate chunk rejected' }",
      "  }",
      "  $serial.WriteLine('caend')",
      "  if((Read-Window 750) -notmatch 'platform certificate saved') { throw 'Certificate was not saved' }",
      "  $epoch=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()",
      "  $serial.WriteLine(('settime {0}' -f $epoch))",
      "  if((Read-Window 500) -notmatch 'UTC time saved') { throw 'Controller UTC time was not saved' }",
      "  $serial.WriteLine(('setwifi {0} {1}' -f $ssid,$password))",
      "  $wifi=Read-Window 2500",
      "  Write-Output $wifi",
      "  if($wifi -notmatch 'wifi configuration saved') { throw 'Wi-Fi configuration was not acknowledged' }",
      "  $serial.WriteLine(('setplatform {0}' -f $platformUrl))",
      "  $platform=Read-Window 2000",
      "  Write-Output $platform",
      "  if($platform -notmatch 'platform url saved') { throw 'Platform URL was not acknowledged' }",
      "  $serial.WriteLine(('pair {0}' -f $pairingCode))",
      "  $pairing=Read-Window 60000",
      "  Write-Output $pairing",
      "  if($pairing -notmatch 'pairing successful') { throw 'Controller pairing did not complete successfully' }",
      "  $serial.WriteLine('status')",
      "  $final=Read-Window 3000",
      "  Write-Output $final",
      "  if($final -notmatch 'state:\\s*PAIRED') { throw 'Controller did not enter PAIRED state' }",
      "}",
      "finally { if($serial.IsOpen){ $serial.Close() }; $serial.Dispose() }",
    ].join("\n");

    const result = await this.execute(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        timeout: 80_000,
        maxBuffer: 1_000_000,
        windowsHide: true,
        env: {
          ...process.env,
          BIOEMS_SERIAL_PORT: port,
          BIOEMS_WIFI_SSID_B64: Buffer.from(input.wifiSsid, "utf8").toString("base64"),
          BIOEMS_WIFI_PASSWORD_B64: Buffer.from(input.wifiPassword, "utf8").toString("base64"),
          BIOEMS_PLATFORM_URL_B64: Buffer.from(input.platformUrl, "utf8").toString("base64"),
          BIOEMS_PAIRING_CODE: input.pairingCode,
          BIOEMS_CA_DER_B64: certificate.toString("base64"),
        },
      }
    );
    const output = `${result.stdout}\n${result.stderr}`;
    return {
      port,
      hardwareUid: provisioningField(output, "hardware-uid", "[A-Fa-f0-9]{12,32}").toUpperCase(),
      platformBindingId: provisioningField(
        output,
        "platform-binding-id",
        "[0-9a-fA-F-]{36}"
      ).toLowerCase(),
      installationId: provisioningField(
        output,
        "installation-id",
        "[0-9a-fA-F-]{36}"
      ).toLowerCase(),
      deviceId: provisioningField(output, "device-id", "[A-Za-z0-9_-]{1,80}"),
      siteCode: provisioningField(output, "site-code", "[A-Za-z0-9_-]{1,80}"),
      toolOutput: redactProvisioningOutput(output, [input.wifiPassword, input.pairingCode]),
    };
  }
}
