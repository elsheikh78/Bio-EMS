import { describe, expect, it } from "vitest";
import { installationSnapshotSchema } from "./installation.schema";

const snapshot = (simModules: number, channel: number) => ({
  companyName: "Bio Egypt",
  sites: [
    {
      code: "MANIAL",
      name: "Manial",
      timezone: "Africa/Cairo",
      areas: [
        {
          code: "COLD",
          name: "Cold room",
          telemetries: [{ code: "T1", name: "Probe 1", type: "TEMPERATURE", unit: "°C" }],
        },
      ],
    },
  ],
  devices: [
    {
      deviceId: "D001",
      siteCode: "MANIAL",
      type: "zone-controller",
      protocol: "mqtt",
      simModules,
      mappings: [{ areaCode: "COLD", telemetryCode: "T1", channel }],
    },
  ],
});

describe("SIM-D4 installation capacity", () => {
  it("accepts one through four fitted modules and maps only installed channels", () => {
    for (const count of [1, 2, 3, 4]) {
      expect(installationSnapshotSchema.safeParse(snapshot(count, count * 4)).success).toBe(true);
      expect(installationSnapshotSchema.safeParse(snapshot(count, count * 4 + 1)).success).toBe(
        false
      );
    }
    expect(installationSnapshotSchema.safeParse(snapshot(4, 0)).success).toBe(false);
    expect(installationSnapshotSchema.safeParse(snapshot(5, 1)).success).toBe(false);
  });
});
