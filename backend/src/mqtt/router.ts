import { handleTelemetry } from "./handlers/telemetry.handler";

export function routeMessage(topic: string, payload: Buffer): void {

    const parts = topic.split("/");

    if (parts.length !== 4) {
        console.warn(`Invalid topic: ${topic}`);
        return;
    }

    const [, siteId, messageType, deviceId] = parts;

    switch (messageType) {

        case "telemetry":
            handleTelemetry(siteId, deviceId, payload);
            break;

        default:
            console.warn(`Unhandled message type: ${messageType}`);
    }
}