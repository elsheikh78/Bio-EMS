import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalProvisioningRunner } from "./device-provisioning.runner";

type Invocation = { executable: string; args: string[] };

describe("LocalProvisioningRunner", () => {
  const directories: string[] = [];

  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function workspace() {
    const root = mkdtempSync(join(tmpdir(), "bioems-provisioner-"));
    directories.push(root);
    const runtime = join(root, "runtime", "esptool");
    const firmware = join(root, "firmware", "site-controller");
    mkdirSync(runtime, { recursive: true });
    mkdirSync(firmware, { recursive: true });
    const esptoolPath = join(runtime, "esptool.exe");
    writeFileSync(esptoolPath, "controlled-test-tool");
    return { root, firmware, esptoolPath };
  }

  it("enumerates only validated Windows COM ports using a fixed PowerShell query", async () => {
    const { root, esptoolPath } = workspace();
    const calls: Invocation[] = [];
    const runner = new LocalProvisioningRunner(
      { applicationRoot: root, esptoolPath },
      async (executable, args) => {
        calls.push({ executable, args });
        return {
          stdout: JSON.stringify([
            {
              port: "COM7",
              name: "USB Serial Device (COM7)",
              pnpDeviceId: "USB\\VID_303A&PID_1001",
              manufacturer: "Espressif",
            },
            { port: "LPT1", name: "not serial" },
          ]),
          stderr: "",
        };
      }
    );

    await expect(runner.listPorts()).resolves.toEqual([
      {
        port: "COM7",
        name: "USB Serial Device (COM7)",
        pnpDeviceId: "USB\\VID_303A&PID_1001",
        manufacturer: "Espressif",
      },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0].executable).toBe("powershell.exe");
    expect(calls[0].args.join(" ")).toContain("Win32_SerialPort");
  });

  it("detects an ESP32-S3 only through the controlled esptool path", async () => {
    const { root, esptoolPath } = workspace();
    const calls: Invocation[] = [];
    const runner = new LocalProvisioningRunner(
      { applicationRoot: root, esptoolPath },
      async (executable, args) => {
        calls.push({ executable, args });
        return {
          stdout: "esptool v5.4.0\nChip is ESP32-S3 (QFN56)\n",
          stderr: "",
        };
      }
    );

    await expect(runner.detect("com12")).resolves.toMatchObject({
      port: "COM12",
      chip: "ESP32-S3",
      supported: true,
    });
    expect(calls[0].executable).toBe(esptoolPath);
    expect(calls[0].args).toEqual([
      "--chip",
      "esp32s3",
      "--port",
      "COM12",
      "--before",
      "default-reset",
      "--after",
      "hard-reset",
      "chip-id",
    ]);
  });

  it("rejects unsafe serial-port input before invoking a tool", async () => {
    const { root, esptoolPath } = workspace();
    let invoked = false;
    const runner = new LocalProvisioningRunner(
      { applicationRoot: root, esptoolPath },
      async () => {
        invoked = true;
        return { stdout: "", stderr: "" };
      }
    );

    await expect(runner.detect("COM4 & calc.exe")).rejects.toThrow();
    expect(invoked).toBe(false);
  });

  it("verifies every firmware segment checksum and invokes a fixed write-flash command", async () => {
    const { root, firmware, esptoolPath } = workspace();
    const bootloader = Buffer.from("bootloader");
    const partition = Buffer.from("partition");
    const app = Buffer.from("application");
    writeFileSync(join(firmware, "bootloader.bin"), bootloader);
    writeFileSync(join(firmware, "partition-table.bin"), partition);
    writeFileSync(join(firmware, "bioems-site-controller.bin"), app);
    const digest = (value: Buffer) => createHash("sha256").update(value).digest("hex");
    const manifestPath = join(firmware, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        schemaVersion: 1,
        target: "esp32s3",
        model: "BIO-EMS-SC-V1",
        firmwareVersion: "0.1.0-pilot.1",
        protocolVersion: "1.3",
        bindingSchemaVersion: 1,
        sourceCommit: "a".repeat(40),
        buildSystem: "ESP-IDF 5.5.5",
        flash: {
          baud: 460800,
          mode: "dio",
          frequency: "40m",
          size: "detect",
        },
        segments: [
          { offset: "0x0", file: "bootloader.bin", sha256: digest(bootloader) },
          { offset: "0x8000", file: "partition-table.bin", sha256: digest(partition) },
          { offset: "0x10000", file: "bioems-site-controller.bin", sha256: digest(app) },
        ],
      })
    );

    const calls: Invocation[] = [];
    const runner = new LocalProvisioningRunner(
      { applicationRoot: root, esptoolPath, firmwareManifestPath: manifestPath },
      async (executable, args) => {
        calls.push({ executable, args });
        return { stdout: "Hash of data verified.\nHard resetting via RTS pin...", stderr: "" };
      }
    );

    await expect(runner.flash("COM8")).resolves.toMatchObject({
      port: "COM8",
      firmwareVersion: "0.1.0-pilot.1",
      protocolVersion: "1.3",
      bindingSchemaVersion: 1,
    });
    expect(calls[0].executable).toBe(esptoolPath);
    expect(calls[0].args).toContain("write-flash");
    expect(calls[0].args).toContain("0x10000");
    expect(calls[0].args.some((value) => value.endsWith("bioems-site-controller.bin"))).toBe(true);
  });

  it("fails closed when a firmware segment checksum does not match", async () => {
    const { root, firmware, esptoolPath } = workspace();
    writeFileSync(join(firmware, "app.bin"), "tampered");
    const manifestPath = join(firmware, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        schemaVersion: 1,
        target: "esp32s3",
        model: "BIO-EMS-SC-V1",
        firmwareVersion: "0.1.0-pilot.1",
        protocolVersion: "1.3",
        bindingSchemaVersion: 1,
        sourceCommit: "a".repeat(40),
        buildSystem: "ESP-IDF 5.5.5",
        flash: { baud: 460800, mode: "dio", frequency: "40m", size: "detect" },
        segments: [{ offset: "0x10000", file: "app.bin", sha256: "a".repeat(64) }],
      })
    );

    let invoked = false;
    const runner = new LocalProvisioningRunner(
      { applicationRoot: root, esptoolPath, firmwareManifestPath: manifestPath },
      async () => {
        invoked = true;
        return { stdout: "", stderr: "" };
      }
    );

    await expect(runner.flash("COM9")).rejects.toThrow("checksum mismatch");
    expect(invoked).toBe(false);
  });
});
