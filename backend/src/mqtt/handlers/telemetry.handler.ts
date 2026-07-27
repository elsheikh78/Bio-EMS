import { writeTelemetry } from "../../../database/influx/writer";

export async function handleTelemetry(
    siteId: string,
    deviceId: string,
    payload: Buffer
): Promise<void> {

    try {

        const data = JSON.parse(payload.toString());

        console.log("");
        console.log("====================================");
        console.log("Telemetry Received");
        console.log("====================================");

        console.log("Site      :", siteId);
        console.log("Device    :", deviceId);

        console.log("");

        console.log(data);

        console.log("====================================");

        await writeTelemetry(siteId, deviceId, data);

    } catch (err) {

        console.error("Invalid Telemetry Payload");

        console.error(err);

    }
}