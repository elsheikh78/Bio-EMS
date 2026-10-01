import { describe, it, expect, vi } from "vitest";
import { LocalProvisioningRunner } from "./device-provisioning.runner";
import { simScanResultSchema } from "./device-provisioning.schema";
const scan = {
  hardwareUid: "AABBCCDDEEFF",
  modules: [1, 2, 3, 4].map((address) => ({
    address,
    responding: address === 2,
    inputs:
      address === 2
        ? [1, 2, 3, 4].map((input) => ({ input, channel: 4 + input, status: 0, value: 5 }))
        : [],
  })),
};
describe("Controller SIM scan", () => {
  it("parses all addresses and inputs through a controlled serial command", async () => {
    const execute = vi.fn(async () => ({ stdout: JSON.stringify(scan), stderr: "" }));
    const runner = new LocalProvisioningRunner({ applicationRoot: ".", esptoolPath: "" }, execute);
    expect(await runner.scanSims("COM7")).toMatchObject({ port: "COM7", ...scan });
    await expect(runner.scanSims("COM7; bad")).rejects.toThrow();
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it("rejects duplicate addresses and incorrect channel mappings", () => {
    expect(
      simScanResultSchema.safeParse({
        ...scan,
        modules: [scan.modules[1], ...scan.modules.slice(1)],
      }).success
    ).toBe(false);
    const bad = structuredClone(scan);
    bad.modules[1].inputs[0].channel = 1;
    expect(simScanResultSchema.safeParse(bad).success).toBe(false);
  });
  it("reports unsupported firmware instead of inventing absent modules", async () => {
    const runner = new LocalProvisioningRunner(
      { applicationRoot: ".", esptoolPath: "" },
      async () => ({ stdout: "", stderr: "" })
    );
    await expect(runner.scanSims("COM7")).rejects.toThrow("did not report");
  });
});
