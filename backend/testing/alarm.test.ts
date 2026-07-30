import { evaluateAlarm } from "../src/services/alarm.evaluator";


evaluateAlarm({

    sensorId: 2,

    sensorName: "Room Temperature Sensor",

    value: 9,

    alarmLow: 2,

    alarmHigh: 8

});