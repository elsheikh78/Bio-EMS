import {
    AlarmRepository,
    Alarm
} from "../repositories/alarm.repository";

import { AppError } from "../errors/app-error";

const repository = new AlarmRepository();

export function createAlarm(
    alarm: Alarm
): number | null {

    const activeAlarm =
        repository.findActiveAlarm(
            alarm.sensor_id,
            alarm.type
        );

    if (activeAlarm) {

        console.log(
            `Alarm already active: Sensor ${alarm.sensor_id} - ${alarm.type}`
        );

        return null;

    }

    return repository.create({

        ...alarm,

        severity: alarm.severity ?? "WARNING",

        status: alarm.status ?? "TRIGGERED"

    });

}

export function getActiveAlarm(
    sensorId: number,
    type: string
): Alarm | undefined {

    return repository.findActiveAlarm(
        sensorId,
        type
    );

}

export function recoverAlarm(
    id: number
): void {

    repository.recoverAlarm(id);

    console.log(
        `Alarm recovered: ${id}`
    );

}

export function acknowledgeAlarm(
    id: number
): void {

    const alarm = repository.getById(id);

    if (!alarm) {

        throw new AppError(
            "Alarm not found",
            404,
            "ALARM_NOT_FOUND"
        );

    }

    if (alarm.status !== "TRIGGERED") {

        throw new AppError(
            "Alarm cannot be acknowledged",
            409,
            "INVALID_ALARM_STATE"
        );

    }

    repository.acknowledgeAlarm(id);

}

export function getAlarmById(
    id: number
): Alarm {

    const alarm = repository.getById(id);

    if (!alarm) {

        throw new AppError(
            "Alarm not found",
            404,
            "ALARM_NOT_FOUND"
        );

    }

    return alarm;

}

export function getActiveAlarms(): Alarm[] {

    return repository.getActive();

}

export function getAlarms(): Alarm[] {

    return repository.getAll();

}