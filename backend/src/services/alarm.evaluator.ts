import {
    createAlarm,
    getActiveAlarm,
    recoverAlarm
} from "./alarm.service";



export interface AlarmCheckInput {

    sensorId: number;

    sensorName: string;

    value: number;

    alarmLow?: number | null;

    alarmHigh?: number | null;

}



export function evaluateAlarm(
    input: AlarmCheckInput
): void {



    /*
        HIGH TEMPERATURE
    */

    if (
        input.alarmHigh !== null &&
        input.alarmHigh !== undefined &&
        input.value > input.alarmHigh
    ) {


        const alarmId = createAlarm({

            sensor_id: input.sensorId,

            type: "HIGH_TEMPERATURE",

            severity: "WARNING",

            status: "TRIGGERED",

            trigger_value: input.value

        });



        if (alarmId) {

            console.log(
                `HIGH ALARM: ${input.sensorName} = ${input.value}`
            );

        }



        return;

    }





    /*
        LOW TEMPERATURE
    */

    if (
        input.alarmLow !== null &&
        input.alarmLow !== undefined &&
        input.value < input.alarmLow
    ) {


        const alarmId = createAlarm({

            sensor_id: input.sensorId,

            type: "LOW_TEMPERATURE",

            severity: "WARNING",

            status: "TRIGGERED",

            trigger_value: input.value

        });



        if (alarmId) {

            console.log(
                `LOW ALARM: ${input.sensorName} = ${input.value}`
            );

        }



        return;

    }





    /*
        RECOVERY CHECK
    */


    const highAlarm =
        getActiveAlarm(
            input.sensorId,
            "HIGH_TEMPERATURE"
        );


    if (
        highAlarm &&
        (
            input.alarmHigh === null ||
            input.alarmHigh === undefined ||
            input.value <= input.alarmHigh
        )
    ) {


        recoverAlarm(
            highAlarm.id!
        );

    }





    const lowAlarm =
        getActiveAlarm(
            input.sensorId,
            "LOW_TEMPERATURE"
        );


    if (
        lowAlarm &&
        (
            input.alarmLow === null ||
            input.alarmLow === undefined ||
            input.value >= input.alarmLow
        )
    ) {


        recoverAlarm(
            lowAlarm.id!
        );

    }





    console.log(
        `Normal: ${input.sensorName} = ${input.value}`
    );


}