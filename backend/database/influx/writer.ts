import { Point } from "@influxdata/influxdb-client";
import { influxDB, org, bucket } from "./client";

const writeApi = influxDB.getWriteApi(org, bucket);

writeApi.useDefaultTags({
    application: "BIO-EMS",
});

export async function writeTelemetry(
    site: string,
    device: string,
    payload: any
): Promise<void> {

    console.log("Writing to InfluxDB...");

    const point = new Point("telemetry")
        .tag("site", site)
        .tag("device", device)
        .floatField("temperature", Number(payload.temperature))
        .floatField("humidity", Number(payload.humidity))
        .floatField("battery", Number(payload.battery))
        .floatField("signal", Number(payload.signal));

    writeApi.writePoint(point);

    await writeApi.flush();

    console.log("InfluxDB Write Success");
}