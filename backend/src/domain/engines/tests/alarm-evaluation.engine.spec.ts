import { describe, expect, it } from "vitest";

import { evaluateAlarm } from "../alarm-evaluation.engine";

import { SensorType } from "../../enums/sensor-type";
import { AlarmStatus } from "../../enums/alarm-status";
import { AlarmSeverity } from "../../enums/alarm-severity";
import { AlarmColor } from "../../enums/alarm-color";

const threshold = {
  alarmLow: 0,
  warningLow: 2,
  warningHigh: 8,
  alarmHigh: 10,
};

describe("AlarmEvaluationEngine", () => {
  it("should return UNKNOWN when value is null", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: null,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.UNKNOWN);
    expect(result.severity).toBe(AlarmSeverity.INFO);
    expect(result.color).toBe(AlarmColor.GRAY);
    expect(result.isAlarm).toBe(false);
  });

  it("should return CRITICAL_LOW", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: -30,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.CRITICAL_LOW);
  });

  it("should return WARNING_LOW", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: 2,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.WARNING_LOW);
  });

  it("should return NORMAL", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: 5,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.NORMAL);
  });

  it("should return WARNING_HIGH", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: 9,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.WARNING_HIGH);
  });

  it("should return CRITICAL_HIGH", () => {
    const result = evaluateAlarm(
      {
        sensorType: SensorType.TEMPERATURE,
        value: 15,
      },
      threshold
    );

    expect(result.status).toBe(AlarmStatus.CRITICAL_HIGH);
  });
});
