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
}

export interface SerialPortInventoryItem {
  port: string;
  name: string | null;
  pnpDeviceId: string | null;
  manufacturer: string | null;
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
}
