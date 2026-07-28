import { handleTelemetry } from "./handlers/telemetry.handler";

export async function routeMessage(
    topic: string,
    payload: Buffer
): Promise<void> {

    const parts = topic.split("/");

    if (parts.length !== 4) {
        console.warn(`Invalid topic: ${topic}`);
        return;
    }

    const [, siteId, messageType, deviceId] = parts;

    switch (messageType) {

        case "telemetry":
    await handleTelemetry(siteId, deviceId, payload);
    break;
    
        default:
            console.warn(`Unhandled message type: ${messageType}`);
    }
}