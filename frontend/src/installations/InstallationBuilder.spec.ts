import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  builderStateFromSnapshot,
  nextAreaCode,
  nextDeviceCode,
  nextTelemetryCode,
  validBuilder,
} from "./InstallationBuilder.model";
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
            warningDelaySeconds: 0,
            criticalDelaySeconds: 0,
            calibrationOffset: 0,
          },
          {
            code: "S2",
            name: "Temperature 2",
            type: "TEMPERATURE" as const,
            unit: "°C",
            deviceId: "D001",
            channel: 2,
            warningDelaySeconds: 0,
            criticalDelaySeconds: 0,
            calibrationOffset: 0,
          },
        ],
      },
    ];

    expect(nextAreaCode(areas)).toBe("A02");
    expect(nextTelemetryCode(areas)).toBe("S3");
    expect(nextDeviceCode([{ deviceId: "D001" }])).toBe("D002");
  });

  it("loads an existing partial installation without losing its identity", () => {
    const state = builderStateFromSnapshot(
      {
        sites: [
          {
            code: "elmanial-001",
            name: "El Manial",
            areas: [
              {
                code: "cold-room",
                name: "Cold Room",
                telemetries: [
                  {
                    code: "S1",
                    name: "Temperature 1",
                    type: "TEMPERATURE",
                    unit: "°C",
                    warningDelaySeconds: 0,
                    criticalDelaySeconds: 0,
                    calibrationOffset: 0,
                  },
                ],
              },
            ],
          },
        ],
        devices: [
          {
            deviceId: "D001",
            siteCode: "elmanial-001",
            mappings: [
              {
                areaCode: "cold-room",
                telemetryCode: "S1",
                channel: 1,
              },
            ],
          },
        ],
      },
      "elmanial-001",
    );

    expect(state.devices).toEqual([{ deviceId: "D001" }]);
    expect(state.areas[0]).toMatchObject({
      code: "cold-room",
      telemetries: [{ code: "S1", deviceId: "D001", channel: 1 }],
    });
    expect(nextTelemetryCode(state.areas)).toBe("S2");
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
            warningDelaySeconds: 0,
            criticalDelaySeconds: 0,
            calibrationOffset: 0,
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
          mappings: [{ areaCode: "A01", telemetryCode: "S1", channel: 1 }],
        },
      ],
    });
  });

  it("maps only fitted SIM-D4 channels while allowing partially populated modules", () => {
    const sensor = (channel: number) => ({
      code: `S${channel}`,
      name: `Probe ${channel}`,
      type: "TEMPERATURE" as const,
      unit: "°C",
      deviceId: "D001",
      channel,
      warningDelaySeconds: 0,
      criticalDelaySeconds: 0,
      calibrationOffset: 0,
    });
    const areas = [
      { code: "A01", name: "Cold Room", telemetries: [sensor(1), sensor(4)] },
    ];
    expect(validBuilder(areas, [{ deviceId: "D001", simModules: 1 }])).toBe(
      true,
    );
    areas[0].telemetries.push(sensor(5));
    expect(validBuilder(areas, [{ deviceId: "D001", simModules: 1 }])).toBe(
      false,
    );
    expect(validBuilder(areas, [{ deviceId: "D001", simModules: 2 }])).toBe(
      true,
    );
    areas[0].telemetries.push(sensor(16));
    expect(validBuilder(areas, [{ deviceId: "D001", simModules: 3 }])).toBe(
      false,
    );
    expect(validBuilder(areas, [{ deviceId: "D001", simModules: 4 }])).toBe(
      true,
    );
    expect(
      buildSnapshot(context, areas, [{ deviceId: "D001", simModules: 4 }])
        .devices[0],
    ).toMatchObject({
      simModules: 4,
      mappings: [
        { channel: 1 },
        { channel: 4 },
        { channel: 5 },
        { channel: 16 },
      ],
    });
  });
});
