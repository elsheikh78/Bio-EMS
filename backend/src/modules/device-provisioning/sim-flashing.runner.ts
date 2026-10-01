import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { windowsSerialPortSchema } from "./device-provisioning.schema";

const execFileAsync = promisify(execFile);
type FlashExecutor = (
  file: string,
  args: string[],
  options: {
    timeout: number;
    maxBuffer: number;
    windowsHide: boolean;
  }
) => Promise<{ stdout: string; stderr: string }>;
const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    target: z.literal("atmega328p-nano"),
    firmwareVersion: z.string().min(1),
    hexFile: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    baud: z.union([z.literal(57600), z.literal(115200)]),
  })
  .strict();

function controlledPath(root: string, candidate: string): string {
  const actualRoot = realpathSync(root);
  const actual = realpathSync(candidate);
  const rel = relative(actualRoot, actual);
  if (rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)))
    return actual;
  throw new Error("SIM flashing file escaped the BIO-EMS application root");
}

export class SimFlashingRunner {
  constructor(
    private readonly config: {
      applicationRoot: string;
      avrdudePath?: string;
      avrdudeConfigPath?: string;
      firmwareManifestPath?: string;
    },
    private readonly execute: FlashExecutor = execFileAsync
  ) {}

  health() {
    let firmwareVersion: string | null = null;
    try {
      if (this.config.firmwareManifestPath) {
        const manifestPath = controlledPath(
          this.config.applicationRoot,
          this.config.firmwareManifestPath
        );
        const manifest = manifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
        if (
          isAbsolute(manifest.hexFile) ||
          manifest.hexFile.includes("..") ||
          !manifest.hexFile.endsWith(".hex")
        )
          throw new Error("Unsafe firmware path");
        const hexPath = controlledPath(
          this.config.applicationRoot,
          resolve(dirname(manifestPath), manifest.hexFile)
        );
        if (createHash("sha256").update(readFileSync(hexPath)).digest("hex") === manifest.sha256)
          firmwareVersion = manifest.firmwareVersion;
      }
    } catch {
      /* No validated firmware is available. */
    }
    return {
      toolReady: Boolean(
        this.config.avrdudePath &&
        existsSync(this.config.avrdudePath) &&
        this.config.avrdudeConfigPath &&
        existsSync(this.config.avrdudeConfigPath)
      ),
      firmwareReady: firmwareVersion !== null,
      firmwareVersion,
    };
  }

  async detect(portInput: string) {
    const port = windowsSerialPortSchema.parse(portInput);
    if (!this.health().toolReady || !this.config.avrdudePath || !this.config.avrdudeConfigPath)
      throw new Error("Controlled AVR tool is not installed");
    const tool = controlledPath(this.config.applicationRoot, this.config.avrdudePath);
    const config = controlledPath(this.config.applicationRoot, this.config.avrdudeConfigPath);
    for (const baud of [57600, 115200]) {
      try {
        const result = await this.execute(
          tool,
          [
            "-C",
            config,
            "-p",
            "m328p",
            "-c",
            "arduino",
            "-P",
            port,
            "-b",
            String(baud),
            "-n",
            "-v",
          ],
          { timeout: 15000, maxBuffer: 1000000, windowsHide: true }
        );
        // USB bridge identity alone cannot establish the MCU or bootloader.
        if (/0x1e950f\b/i.test(`${result.stdout}\n${result.stderr}`))
          return { port, supported: true, chip: "ATmega328P", baud };
      } catch {
        /* Try the other supported Nano bootloader baud without writing. */
      }
    }
    return { port, supported: false, chip: null, baud: null };
  }

  async flash(portInput: string, expectedVersion: string) {
    const port = windowsSerialPortSchema.parse(portInput);
    const { applicationRoot, avrdudePath, avrdudeConfigPath, firmwareManifestPath } = this.config;
    if (
      !avrdudePath ||
      !avrdudeConfigPath ||
      !firmwareManifestPath ||
      !this.health().toolReady ||
      !this.health().firmwareReady
    ) {
      throw new Error("Controlled SIM firmware or flashing tool is not installed");
    }
    const manifestPath = controlledPath(applicationRoot, firmwareManifestPath);
    const manifest = manifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8")));
    if (manifest.firmwareVersion !== expectedVersion)
      throw new Error("SIM firmware version does not match the requested version");
    if (
      isAbsolute(manifest.hexFile) ||
      manifest.hexFile.includes("..") ||
      !manifest.hexFile.endsWith(".hex")
    ) {
      throw new Error("SIM firmware manifest has an unsafe path");
    }
    const hexPath = controlledPath(
      applicationRoot,
      resolve(dirname(manifestPath), manifest.hexFile)
    );
    const digest = createHash("sha256").update(readFileSync(hexPath)).digest("hex");
    if (digest !== manifest.sha256) throw new Error("SIM firmware checksum mismatch");
    const detected = await this.detect(port);
    if (!detected.supported || detected.baud !== manifest.baud)
      throw new Error(
        "Nano detection failed or bootloader baud does not match the installed firmware package"
      );
    const tool = controlledPath(applicationRoot, avrdudePath);
    const config = controlledPath(applicationRoot, avrdudeConfigPath);
    // Bootloader baud differs between classic and newer Nano boards. The controlled
    // manifest selects it; avrdude verifies flashed bytes before reporting success.
    const args = [
      "-C",
      config,
      "-p",
      "m328p",
      "-c",
      "arduino",
      "-P",
      port,
      "-b",
      String(manifest.baud),
      "-D",
      "-U",
      `flash:w:${hexPath}:i`,
    ];
    const result = await this.execute(tool, args, {
      timeout: 120_000,
      maxBuffer: 1_000_000,
      windowsHide: true,
    });
    return {
      port,
      firmwareVersion: manifest.firmwareVersion,
      toolOutput: `${result.stdout}\n${result.stderr}`.slice(-8000),
    };
  }
}
