import { handleTelemetry } from "../modules/telemetry/listeners/telemetry.listener";

export async function routeMessage(
    topic: string,
    payload: Buffer
): Promise<void> {

    const parts = topic.split("/");

    if (parts.length !== 4) {
        console.warn(`Invalid topic: ${topic}`);
        return;
    }

    const [, , messageType] = parts;

    switch (messageType) {

        case "telemetry":
            await handleTelemetry(topic, payload);
            break;

        default:
            console.warn(`Unhandled message type: ${messageType}`);
    }

}