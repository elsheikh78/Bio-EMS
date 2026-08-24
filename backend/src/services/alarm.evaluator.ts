import { AlarmSeverity } from "../domain/enums/alarm-severity";
import { AlarmStatus } from "../domain/enums/alarm-status";
import { SensorType } from "../domain/enums/sensor-type";
import { evaluateAlarm as evaluateDomainAlarm } from "../domain/engines/alarm-evaluation.engine";
import { AlarmActivationCandidateRepository } from "../repositories/alarm-activation-candidate.repository";
import { createAlarm, getActiveAlarm, recoverAlarm } from "./alarm.service";

export interface AlarmCheckInput {
  sensorId: number;
  sensorName: string;
  value: number;
  sensorType: string;
  warningLow?: number | null;
  alarmLow?: number | null;
  warningHigh?: number | null;
  alarmHigh?: number | null;
  warningDelaySeconds?: number;
  criticalDelaySeconds?: number;
}

export interface AlarmEvaluatorDependencies {
  candidates: AlarmActivationCandidateRepository;
  createAlarm: typeof createAlarm;
  getActiveAlarm: typeof getActiveAlarm;
  recoverAlarm: typeof recoverAlarm;
  now: () => Date;
}

const defaultDependencies: AlarmEvaluatorDependencies = {
  candidates: new AlarmActivationCandidateRepository(),
  createAlarm,
  getActiveAlarm,
  recoverAlarm,
  now: () => new Date(),
};

export class AlarmEvaluator {
  constructor(private readonly dependencies: AlarmEvaluatorDependencies = defaultDependencies) {}

  evaluate(input: AlarmCheckInput): void {
    const result = evaluateDomainAlarm(
      { sensorType: input.sensorType.toUpperCase() as SensorType, value: input.value },
      {
        warningLow: input.warningLow ?? undefined,
        alarmLow: input.alarmLow ?? undefined,
        warningHigh: input.warningHigh ?? undefined,
        alarmHigh: input.alarmHigh ?? undefined,
      }
    );
    const low = [AlarmStatus.WARNING_LOW, AlarmStatus.CRITICAL_LOW];
    const high = [AlarmStatus.WARNING_HIGH, AlarmStatus.CRITICAL_HIGH];
    const desiredType = low.includes(result.status)
      ? "LOW_TEMPERATURE"
      : high.includes(result.status)
        ? "HIGH_TEMPERATURE"
        : undefined;

    for (const type of ["LOW_TEMPERATURE", "HIGH_TEMPERATURE"]) {
      const active = this.dependencies.getActiveAlarm(input.sensorId, type);
      if (active?.id !== undefined && type !== desiredType)
        this.dependencies.recoverAlarm(active.id);
    }

    if (!desiredType) {
      this.dependencies.candidates.delete(input.sensorId);
      this.log(result.status, input);
      return;
    }
    if (this.dependencies.getActiveAlarm(input.sensorId, desiredType)) {
      this.dependencies.candidates.delete(input.sensorId);
      return;
    }

    const severity = result.severity as "WARNING" | "CRITICAL";
    const delaySeconds =
      severity === AlarmSeverity.CRITICAL
        ? (input.criticalDelaySeconds ?? 0)
        : (input.warningDelaySeconds ?? 0);
    if (delaySeconds === 0) {
      this.activate(input, desiredType, severity);
      return;
    }

    const observedAt = this.dependencies.now().toISOString();
    const candidate = this.dependencies.candidates.find(input.sensorId);
    if (!candidate || candidate.alarm_type !== desiredType || candidate.severity !== severity) {
      this.dependencies.candidates.replace({
        sensor_id: input.sensorId,
        alarm_type: desiredType,
        severity,
        first_observed_at: observedAt,
        last_observed_at: observedAt,
        latest_value: input.value,
      });
      return;
    }

    this.dependencies.candidates.updateObservation(input.sensorId, observedAt, input.value);
    const elapsedMilliseconds = Date.parse(observedAt) - Date.parse(candidate.first_observed_at);
    if (elapsedMilliseconds >= delaySeconds * 1_000) {
      this.activate(input, desiredType, severity);
    }
  }

  private activate(input: AlarmCheckInput, type: string, severity: "WARNING" | "CRITICAL"): void {
    const alarmId = this.dependencies.createAlarm({
      sensor_id: input.sensorId,
      type,
      severity,
      status: "TRIGGERED",
      trigger_value: input.value,
    });
    this.dependencies.candidates.delete(input.sensorId);
    if (alarmId) this.log(severity, input);
  }

  private log(status: string, input: AlarmCheckInput): void {
    console.log(`${status}: ${input.sensorName} = ${input.value}`);
  }
}

const alarmEvaluator = new AlarmEvaluator();
export function evaluateAlarm(input: AlarmCheckInput): void {
  alarmEvaluator.evaluate(input);
}
