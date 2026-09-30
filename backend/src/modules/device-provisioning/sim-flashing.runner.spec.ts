import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimFlashingRunner } from "./sim-flashing.runner";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("SIM USB flashing", () => {
  it("uses only a checked firmware and enables avrdude verification", async () => {
    const root = mkdtempSync(join(tmpdir(), "sim-flash-"));
    roots.push(root);
    const firmware = join(root, "firmware");
    mkdirSync(firmware);
    const hex = Buffer.from(":00000001FF\n");
    writeFileSync(join(firmware, "sim.hex"), hex);
    writeFileSync(
      join(firmware, "manifest.json"),
      JSON.stringify({
        schemaVersion: 1,
        target: "atmega328p-nano",
        firmwareVersion: "0.1.0",
        hexFile: "sim.hex",
        sha256: createHash("sha256").update(hex).digest("hex"),
        baud: 57600,
      })
    );
    writeFileSync(join(root, "avrdude.exe"), "");
    writeFileSync(join(root, "avrdude.conf"), "");
    const execute = vi.fn(async (_file: string, _args: string[]) => ({
      stdout: "verified",
      stderr: "",
    }));
    const runner = new SimFlashingRunner(
      {
        applicationRoot: root,
        avrdudePath: join(root, "avrdude.exe"),
        avrdudeConfigPath: join(root, "avrdude.conf"),
        firmwareManifestPath: join(firmware, "manifest.json"),
      },
      execute
    );
    await expect(runner.flash("COM7", "0.1.0")).resolves.toMatchObject({
      firmwareVersion: "0.1.0",
    });
    expect(execute.mock.calls[0]?.[1]).not.toContain("-V");
    await expect(runner.flash("COM7", "0.2.0")).rejects.toThrow("version");
    writeFileSync(join(firmware, "sim.hex"), "changed");
    expect(runner.health().firmwareReady).toBe(false);
    await expect(runner.flash("COM7", "0.1.0")).rejects.toThrow("not installed");
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
