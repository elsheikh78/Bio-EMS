import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  nextAreaCode,
  nextDeviceCode,
  nextTelemetryCode,
} from "./InstallationBuilder";
import type { InstallationContext } from "./contracts";

const context: InstallationContext = {
  installationId: "11111111-1111-4111-8111-111111111111",
  source: "INSTALLER_PROVISIONING_RECEIPT",
  customer: { id: 1, code: "BIO-EGYPT", name: "Bio Egypt" },
  site: {
    id: 2,
    code: "elmanial-001",
    name: "El Manial",
    location: "Cairo",
    timezone: "Africa/Cairo",
  },
};

describe("InstallationBuilder identifiers and snapshot", () => {
  it("generates collision-free sequential identifiers", () => {
    const areas = [
      {
        code: "A01",
        name: "Cold Room",
        telemetries: [
          {
            code: "S1",
            name: "Temperature 1",
            type: "TEMPERATURE" as const,
            unit: "°C",
            deviceId: "D001",
            channel: 1,
          },
          {
            code: "S2",
            name: "Temperature 2",
            type: "TEMPERATURE" as const,
            unit: "°C",
            deviceId: "D001",
            channel: 2,
          },
        ],
      },
    ];

    expect(nextAreaCode(areas)).toBe("A02");
    expect(nextTelemetryCode(areas)).toBe("S3");
    expect(nextDeviceCode([{ deviceId: "D001" }])).toBe("D002");
  });

  it("builds one governed logical snapshot before device provisioning", () => {
    const areas = [
      {
        code: "A01",
        name: "Cold Room",
        telemetries: [
          {
            code: "S1",
            name: "Temperature 1",
            type: "TEMPERATURE" as const,
            unit: "°C",
            deviceId: "D001",
            channel: 1,
          },
        ],
      },
    ];
    const snapshot = buildSnapshot(context, areas, [{ deviceId: "D001" }]);

    expect(snapshot).toMatchObject({
      companyName: "Bio Egypt",
      sites: [
        {
          code: "elmanial-001",
          name: "El Manial",
          areas: [
            {
              code: "A01",
              telemetries: [{ code: "S1", type: "TEMPERATURE" }],
            },
          ],
        },
      ],
      devices: [
        {
          deviceId: "D001",
          siteCode: "elmanial-001",
          mappings: [
            { areaCode: "A01", telemetryCode: "S1", channel: 1 },
          ],
        },
      ],
    });
  });
});
