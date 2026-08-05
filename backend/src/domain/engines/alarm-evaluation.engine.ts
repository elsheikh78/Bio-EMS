import { AlarmMessageKeys } from "../constants/alarm-message-keys";
import { AlarmColor } from "../enums/alarm-color";
import { AlarmSeverity } from "../enums/alarm-severity";
import { AlarmStatus } from "../enums/alarm-status";
import { AlarmThreshold } from "../value-objects/alarm-threshold";
import { AlarmEvaluationResult } from "../value-objects/alarm-evaluation-result";
import { SensorReading } from "../value-objects/sensor-reading";
export function evaluateAlarm(
  reading: SensorReading,
  threshold: AlarmThreshold
): AlarmEvaluationResult {

  if (reading.value === null) {
    return createResult(
      AlarmStatus.UNKNOWN,
      AlarmSeverity.INFO,
      AlarmColor.GRAY,
      false,
      AlarmMessageKeys.UNKNOWN
    );
  }

  return evaluateNumeric(reading.value, threshold);
}
function evaluateNumeric(
  value: number,
  threshold: AlarmThreshold
): AlarmEvaluationResult {

  // Evaluation order:
  // 1. Critical Low
  // 2. Warning Low
  // 3. Critical High
  // 4. Warning High
  // 5. Normal

  if (
    threshold.alarmLow !== undefined &&
    value <= threshold.alarmLow
  ) {
    return createResult(
      AlarmStatus.CRITICAL_LOW,
      AlarmSeverity.CRITICAL,
      AlarmColor.RED,
      true,
      AlarmMessageKeys.CRITICAL_LOW
    );
  }

  if (
    threshold.warningLow !== undefined &&
    value <= threshold.warningLow
  ) {
    return createResult(
      AlarmStatus.LOW,
      AlarmSeverity.WARNING,
      AlarmColor.YELLOW,
      true,
      AlarmMessageKeys.LOW
    );
  }

  if (
    threshold.alarmHigh !== undefined &&
    value >= threshold.alarmHigh
  ) {
    return createResult(
      AlarmStatus.CRITICAL_HIGH,
      AlarmSeverity.CRITICAL,
      AlarmColor.RED,
      true,
      AlarmMessageKeys.CRITICAL_HIGH
    );
  }

  if (
    threshold.warningHigh !== undefined &&
    value >= threshold.warningHigh
  ) {
    return createResult(
      AlarmStatus.HIGH,
      AlarmSeverity.WARNING,
      AlarmColor.YELLOW,
      true,
      AlarmMessageKeys.HIGH
    );
  }

  return createResult(
    AlarmStatus.NORMAL,
    AlarmSeverity.INFO,
    AlarmColor.GREEN,
    false,
    AlarmMessageKeys.NORMAL
  );
}
function createResult(
  status: AlarmStatus,
  severity: AlarmSeverity,
  color: AlarmColor,
  isAlarm: boolean,
  messageKey: AlarmEvaluationResult["messageKey"]
): AlarmEvaluationResult {

  return {
    status,
    severity,
    color,
    isAlarm,
    messageKey
  };
}