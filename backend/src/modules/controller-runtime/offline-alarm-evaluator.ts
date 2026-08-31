import type * as Sync from "../controller-sync/offline-critical-config.contract";
import type * as Acquisition from "./sensor-acquisition.service";

type Bundle = Sync.OfflineCriticalConfigBundle;
type Cycle = Acquisition.SensorAcquisitionCycle;
type Sample = Acquisition.SensorAcquisitionSample;
type SensorConfig = Bundle["sensors"][number];

export type OfflineAlarmCondition =
  "NORMAL" | "WARNING_LOW" | "WARNING_HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | "SENSOR_FAULT";

export type OfflineAlarmPhase = "NORMAL" | "PENDING" | "ACTIVE" | "FAULT";

export interface OfflineAlarmEvaluation {
  sensor_uuid: string;
  device_id: string;
  channel: number;
  sampled_at: string;
  value_celsius: number | null;
  condition: OfflineAlarmCondition;
  phase: OfflineAlarmPhase;
  first_observed_at: string | null;
  activated_at: string | null;
}

interface PendingAlarmState {
  condition: Exclude<OfflineAlarmCondition, "NORMAL" | "SENSOR_FAULT">;
  firstObservedAt: string;
  activatedAt: string | null;
}

export class OfflineAlarmEvaluator {
  private readonly states = new Map<string, PendingAlarmState>();

  evaluate(bundle: Bundle, cycle: Cycle): OfflineAlarmEvaluation[] {
    const configured = new Map(bundle.sensors.map((sensor) => [sensor.sensor_uuid, sensor]));
    return cycle.samples.map((sample) => {
      const sensor = configured.get(sample.sensor_uuid);
      if (!sensor) {
        throw new TypeError(`Sensor ${sample.sensor_uuid} is not present in effective config`);
      }
      if (sensor.device_id !== sample.device_id || sensor.channel !== sample.channel) {
        throw new TypeError(`Sensor identity mismatch for ${sample.sensor_uuid}`);
      }
      return this.evaluateSample(sensor, sample);
    });
  }

  reset(sensorUuid?: string): void {
    if (sensorUuid) {
      this.states.delete(sensorUuid);
      return;
    }
    this.states.clear();
  }

  private evaluateSample(sensor: SensorConfig, sample: Sample): OfflineAlarmEvaluation {
    if (sample.status !== "OK" || sample.value_celsius === null) {
      this.states.delete(sample.sensor_uuid);
      return this.result(sample, "SENSOR_FAULT", "FAULT", null, null);
    }

    const condition = classify(sample.value_celsius, sensor);
    if (condition === "NORMAL") {
      this.states.delete(sample.sensor_uuid);
      return this.result(sample, condition, "NORMAL", null, null);
    }

    let delaySeconds = sensor.warning_delay_seconds ?? 0;
    if (condition.startsWith("CRITICAL")) {
      delaySeconds = sensor.critical_delay_seconds;
    }

    const existing = this.states.get(sample.sensor_uuid);
    const firstObservedAt =
      existing?.condition === condition ? existing.firstObservedAt : sample.sampled_at;
    const elapsedMs = Date.parse(sample.sampled_at) - Date.parse(firstObservedAt);

    if (elapsedMs < 0) {
      throw new TypeError(`Non-monotonic sample timestamp for ${sample.sensor_uuid}`);
    }

    if (delaySeconds === 0 || elapsedMs >= delaySeconds * 1_000) {
      const activatedAt = existing?.condition === condition ? existing.activatedAt : null;
      const effectiveActivatedAt = activatedAt ?? sample.sampled_at;
      this.states.set(sample.sensor_uuid, {
        condition,
        firstObservedAt,
        activatedAt: effectiveActivatedAt,
      });
      return this.result(sample, condition, "ACTIVE", firstObservedAt, effectiveActivatedAt);
    }

    this.states.set(sample.sensor_uuid, {
      condition,
      firstObservedAt,
      activatedAt: null,
    });
    return this.result(sample, condition, "PENDING", firstObservedAt, null);
  }

  private result(
    sample: Sample,
    condition: OfflineAlarmCondition,
    phase: OfflineAlarmPhase,
    firstObservedAt: string | null,
    activatedAt: string | null
  ): OfflineAlarmEvaluation {
    return {
      sensor_uuid: sample.sensor_uuid,
      device_id: sample.device_id,
      channel: sample.channel,
      sampled_at: sample.sampled_at,
      value_celsius: sample.value_celsius,
      condition,
      phase,
      first_observed_at: firstObservedAt,
      activated_at: activatedAt,
    };
  }
}

function classify(
  value: number,
  sensor: SensorConfig
): Exclude<OfflineAlarmCondition, "SENSOR_FAULT"> {
  if (sensor.alarm_low !== null && value <= sensor.alarm_low) {
    return "CRITICAL_LOW";
  }
  if (sensor.warning_low !== undefined && sensor.warning_low !== null) {
    if (value <= sensor.warning_low) return "WARNING_LOW";
  }
  if (sensor.alarm_high !== null && value >= sensor.alarm_high) {
    return "CRITICAL_HIGH";
  }
  if (sensor.warning_high !== undefined && sensor.warning_high !== null) {
    if (value >= sensor.warning_high) return "WARNING_HIGH";
  }
  return "NORMAL";
}
