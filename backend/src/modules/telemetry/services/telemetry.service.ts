import { TelemetryPayload } from "../schemas/telemetry.schema";
import { DeviceRepository } from "../../../repositories/device.repository";
import { SensorRepository } from "../../../repositories/sensor.repository";
import { writeTelemetryPoint } from "../../../../database/influx/writer";
import { evaluateAlarm } from "../../../services/alarm.evaluator";


const deviceRepository = new DeviceRepository();

const sensorRepository = new SensorRepository();



export class TelemetryService {


    async process(
        topic: string,
        payload: TelemetryPayload
    ): Promise<void> {


        const parts = topic.split("/");


        if (parts.length !== 4) {

            throw new Error(
                `Invalid MQTT Topic : ${topic}`
            );

        }



        const [
            ,
            siteCode,
            messageType,
            deviceId

        ] = parts;



        const device =
            deviceRepository.findByDeviceId(deviceId);



        if (!device) {

            console.warn(
                `Unknown Device rejected : ${deviceId}`
            );

            return;

        }



        console.log("====================================");

        console.log("Telemetry Accepted");

        console.log("Site       :", siteCode);

        console.log("Message    :", messageType);

        console.log("Device     :", device.device_id);



        for (const sensorData of payload.sensors) {


            const sensor =
                sensorRepository.findByDeviceAndChannel(
                    device.id!,
                    sensorData.channel
                );



            if (!sensor) {

                console.warn(
                    `Unknown Sensor Channel rejected : ${sensorData.channel}`
                );

                continue;

            }



            console.log("------------------------------------");

            console.log("Sensor Resolved");

            console.log("Name       :", sensor.name);

            console.log("Type       :", sensor.sensor_type);

            console.log("Channel    :", sensor.channel);

            console.log(
                "Value      :",
                sensorData.value,
                sensor.unit
            );

            evaluateAlarm({

    sensorId: sensor.id!,

    sensorName: sensor.name,

    value: sensorData.value,

    alarmLow: sensor.alarm_low,

    alarmHigh: sensor.alarm_high

});



            await writeTelemetryPoint({

                site: siteCode,

                device: device.device_id,

                sensor: sensor.code,

                sensorType: sensor.sensor_type,

                unit: sensor.unit,

                value: sensorData.value

            });



        }



        console.log("====================================");


    }

}