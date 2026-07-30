import {
    AlarmRepository,
    Alarm
} from "../repositories/alarm.repository";


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





export function getAlarms(): Alarm[] {

    return repository.getAll();

}