import { z } from "zod";
import type { OfflineCriticalConfigBundle } from "../controller-sync/offline-critical-config.contract";

const sampledAtSchema = z.string().datetime({ offset: true });
const DS18B20_MIN_C = -55;
const DS18B20_MAX_C = 125;
const DS18B20_DISCONNECTED_SENTINEL_C = -127;

export type SensorAcquisitionStatus = "OK" | "DISCONNECTED" | "INVALID" | "READ_ERROR";

export interface SensorAcquisitionTarget {
  sensor_uuid: string;
  device_id: string;
  channel: number;
}

export interface Ds18b20Reader {
  readCelsius(target: SensorAcquisitionTarget): number | null;
}

export interface SensorAcquisitionSample extends SensorAcquisitionTarget {
  sampled_at: string;
  status: SensorAcquisitionStatus;
  value_celsius: number | null;
}

export interface SensorAcquisitionCycle {
  sampled_at: string;
  samples: SensorAcquisitionSample[];
}

export function acquireConfiguredSensors(
  bundle: OfflineCriticalConfigBundle,
  reader: Ds18b20Reader,
  sampledAt: string
): SensorAcquisitionCycle {
  const timestamp = sampledAtSchema.parse(sampledAt);

  const samples = bundle.sensors.map((sensor): SensorAcquisitionSample => {
    const target: SensorAcquisitionTarget = {
      sensor_uuid: sensor.sensor_uuid,
      device_id: sensor.device_id,
      channel: sensor.channel,
    };

    let raw: number | null;
    try {
      raw = reader.readCelsius(target);
    } catch {
      return { ...target, sampled_at: timestamp, status: "READ_ERROR", value_celsius: null };
    }

    if (raw === null || raw === DS18B20_DISCONNECTED_SENTINEL_C) {
      return { ...target, sampled_at: timestamp, status: "DISCONNECTED", value_celsius: null };
    }

    if (!Number.isFinite(raw) || raw < DS18B20_MIN_C || raw > DS18B20_MAX_C) {
      return { ...target, sampled_at: timestamp, status: "INVALID", value_celsius: null };
    }

    return { ...target, sampled_at: timestamp, status: "OK", value_celsius: raw };
  });

  return { sampled_at: timestamp, samples };
}
