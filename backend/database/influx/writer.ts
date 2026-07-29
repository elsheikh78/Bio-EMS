import { Point } from "@influxdata/influxdb-client";
import { influxDB, org, bucket } from "./client";


const writeApi = influxDB.getWriteApi(
    org,
    bucket
);


writeApi.useDefaultTags({
    application: "BIO-EMS",
});



export interface TelemetryPoint {

    site: string;

    device: string;

    sensor: string;

    sensorType: string;

    unit: string;

    value: number;

    timestamp?: string;

}



export async function writeTelemetryPoint(
    data: TelemetryPoint
): Promise<void> {


    console.log("Writing Telemetry Point to InfluxDB...");



    const point = new Point(data.sensorType)

        .tag("site", data.site)

        .tag("device", data.device)

        .tag("sensor", data.sensor)

        .tag("unit", data.unit)

        .floatField(
            "value",
            data.value
        );



    writeApi.writePoint(point);


    await writeApi.flush();


    console.log(
        "InfluxDB Write Success"
    );

}