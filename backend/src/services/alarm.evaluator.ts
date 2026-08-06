import { createAlarm, getActiveAlarm, recoverAlarm } from "./alarm.service";
import { evaluateAlarm as evaluateDomainAlarm } from "../domain/engines/alarm-evaluation.engine";
import { AlarmStatus } from "../domain/enums/alarm-status";
import { SensorType } from "../domain/enums/sensor-type";

export interface AlarmCheckInput {
  sensorId: number;

  sensorName: string;

  value: number;

  sensorType: string;

  warningLow?: number | null;

  alarmLow?: number | null;

  warningHigh?: number | null;

  alarmHigh?: number | null;
}

export function evaluateAlarm(input: AlarmCheckInput): void {
  const result = evaluateDomainAlarm(
    {
      sensorType: input.sensorType.toUpperCase() as SensorType,
      value: input.value,
    },
    {
      warningLow: input.warningLow ?? undefined,
      alarmLow: input.alarmLow ?? undefined,
      warningHigh: input.warningHigh ?? undefined,
      alarmHigh: input.alarmHigh ?? undefined,
    }
  );

  const lowStatuses = [AlarmStatus.WARNING_LOW, AlarmStatus.CRITICAL_LOW];
  const highStatuses = [AlarmStatus.WARNING_HIGH, AlarmStatus.CRITICAL_HIGH];
  const desiredType = lowStatuses.includes(result.status)
    ? "LOW_TEMPERATURE"
    : highStatuses.includes(result.status)
      ? "HIGH_TEMPERATURE"
      : undefined;

  for (const type of ["LOW_TEMPERATURE", "HIGH_TEMPERATURE"]) {
    const activeAlarm = getActiveAlarm(input.sensorId, type);
    if (activeAlarm?.id !== undefined && type !== desiredType) {
      recoverAlarm(activeAlarm.id);
    }
  }

  if (desiredType) {
    const alarmId = createAlarm({
      sensor_id: input.sensorId,
      type: desiredType,
      severity: result.severity,
      status: "TRIGGERED",
      trigger_value: input.value,
    });

    if (alarmId) {
      console.log(`${result.status}: ${input.sensorName} = ${input.value}`);
    }
  } else {
    console.log(`${result.status}: ${input.sensorName} = ${input.value}`);
  }
}
