import { AlarmRepository, Alarm } from "../repositories/alarm.repository";

import { AppError } from "../errors/app-error";
import { notificationService } from "../modules/notification/notification.service";
import { sqlite } from "../../database/sqlite/client";

const repository = new AlarmRepository();

export function createAlarm(alarm: Alarm): number | null {
  const activeAlarm = repository.findActiveAlarm(alarm.sensor_id, alarm.type);

  if (activeAlarm) {
    console.log(`Alarm already active: Sensor ${alarm.sensor_id} - ${alarm.type}`);

    return null;
  }

  return sqlite.transaction(() => {
    const alarmId = repository.create({
      ...alarm,

      severity: alarm.severity ?? "WARNING",

      status: alarm.status ?? "TRIGGERED",
    });

    notificationService.publishAlarmTriggered({
      alarmId,
      sensorId: alarm.sensor_id,
      alarmType: alarm.type,
      severity: alarm.severity ?? "WARNING",
      triggerValue: alarm.trigger_value,
      occurredAt: new Date().toISOString(),
    });

    return alarmId;
  })();
}

export function getActiveAlarm(sensorId: number, type: string): Alarm | undefined {
  return repository.findActiveAlarm(sensorId, type);
}

export function recoverAlarm(id: number): void {
  const recovered = sqlite.transaction(() => {
    if (!repository.recoverAlarm(id)) {
      return false;
    }

    notificationService.publishAlarmRecovered(id, new Date().toISOString());
    return true;
  })();

  if (recovered) {
    console.log(`Alarm recovered: ${id}`);
  }
}

export function acknowledgeAlarm(id: number, acknowledgingUserId: number): Alarm {
  return sqlite.transaction(() => {
    const alarm = repository.getById(id);

    if (!alarm) {
      throw new AppError("Alarm not found", 404, "ALARM_NOT_FOUND");
    }

    if (alarm.status !== "TRIGGERED") {
      throw new AppError("Alarm cannot be acknowledged", 409, "INVALID_ALARM_STATE");
    }

    const acknowledged = repository.acknowledgeAlarm(id, acknowledgingUserId);

    if (!acknowledged) {
      throw new AppError("Alarm cannot be acknowledged", 409, "INVALID_ALARM_STATE");
    }

    notificationService.publishAlarmAcknowledged(id, acknowledgingUserId, new Date().toISOString());

    return {
      ...alarm,
      status: "ACKNOWLEDGED",
    };
  })();
}

export function getAlarmById(id: number): Alarm {
  const alarm = repository.getById(id);

  if (!alarm) {
    throw new AppError("Alarm not found", 404, "ALARM_NOT_FOUND");
  }

  return alarm;
}

export function getActiveAlarms(): Alarm[] {
  return repository.getActive();
}

export function getAlarms(): Alarm[] {
  return repository.getAll();
}
