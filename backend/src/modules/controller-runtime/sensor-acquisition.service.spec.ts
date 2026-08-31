import { describe, expect, it } from "vitest";
import type { OfflineCriticalConfigBundle } from "../controller-sync/offline-critical-config.contract";
import { acquireConfiguredSensors, type Ds18b20Reader } from "./sensor-acquisition.service";

const SITE_UUID = "e70cb67a-0ab0-4e57-ac61-d6142990ca37";
const bundle: OfflineCriticalConfigBundle = {
  contract_version: 1,
  config_version: 8,
  site_uuid: SITE_UUID,
  issued_at: "2026-08-31T16:20:00Z",
  sensors: [
    {
      sensor_uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
      device_id: "ZC-FW-001",
      channel: 1,
      enabled: true,
      alarm_low: 2,
      alarm_high: 8,
      critical_delay_seconds: 30,
    },
    {
      sensor_uuid: "9b76a557-83e6-4f0d-a0cb-fc2bb29f3d22",
      device_id: "ZC-FW-001",
      channel: 2,
      enabled: true,
      alarm_low: 2,
      alarm_high: 8,
      critical_delay_seconds: 30,
    },
  ],
  sms_failover: { enabled: false, primary_unavailable_after_seconds: 300 },
  sms_targets: [],
  critical_escalation_steps: [],
};

function reader(values: Map<number, number | null>): Ds18b20Reader {
  return {
    readCelsius: ({ channel }) => values.get(channel) ?? null,
  };
}

describe("controller sensor acquisition", () => {
  it("keeps stable Sensor, Device, and channel identity with one cycle timestamp", () => {
    const cycle = acquireConfiguredSensors(
      bundle,
      reader(
        new Map([
          [1, 5.25],
          [2, 6.5],
        ])
      ),
      "2026-08-31T16:21:00Z"
    );

    expect(cycle.samples).toEqual([
      {
        sensor_uuid: bundle.sensors[0].sensor_uuid,
        device_id: "ZC-FW-001",
        channel: 1,
        sampled_at: cycle.sampled_at,
        status: "OK",
        value_celsius: 5.25,
      },
      {
        sensor_uuid: bundle.sensors[1].sensor_uuid,
        device_id: "ZC-FW-001",
        channel: 2,
        sampled_at: cycle.sampled_at,
        status: "OK",
        value_celsius: 6.5,
      },
    ]);
  });

  it("marks null and the DS18B20 -127 sentinel as disconnected", () => {
    const nullCycle = acquireConfiguredSensors(bundle, reader(new Map([[1, null]])), "2026-08-31T16:21:00Z");
    expect(nullCycle.samples[0]).toMatchObject({ status: "DISCONNECTED", value_celsius: null });

    const sentinelCycle = acquireConfiguredSensors(
      bundle,
      reader(new Map([[1, -127]])),
      "2026-08-31T16:21:00Z"
    );
    expect(sentinelCycle.samples[0]).toMatchObject({ status: "DISCONNECTED", value_celsius: null });
  });

  it("rejects non-finite and out-of-range DS18B20 values", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -56, 126]) {
      const cycle = acquireConfiguredSensors(bundle, reader(new Map([[1, value]])), "2026-08-31T16:21:00Z");
      expect(cycle.samples[0]).toMatchObject({ status: "INVALID", value_celsius: null });
    }
  });

  it("isolates reader exceptions to the affected Sensor", () => {
    const throwingReader: Ds18b20Reader = {
      readCelsius: ({ channel }) => {
        if (channel === 1) throw new Error("bus fault");
        return 4.5;
      },
    };

    const cycle = acquireConfiguredSensors(bundle, throwingReader, "2026-08-31T16:21:00Z");
    expect(cycle.samples[0]).toMatchObject({ status: "READ_ERROR", value_celsius: null });
    expect(cycle.samples[1]).toMatchObject({ status: "OK", value_celsius: 4.5 });
  });

  it("rejects invalid sample timestamps before reading hardware", () => {
    let reads = 0;
    const countingReader: Ds18b20Reader = {
      readCelsius: () => {
        reads += 1;
        return 5;
      },
    };

    expect(() => acquireConfiguredSensors(bundle, countingReader, "not-a-time")).toThrow();
    expect(reads).toBe(0);
  });
});
