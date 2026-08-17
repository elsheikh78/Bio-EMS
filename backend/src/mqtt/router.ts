import { handleTelemetry } from "../modules/telemetry/listeners/telemetry.listener";
import { handleHeartbeat } from "../modules/device/listeners/heartbeat.listener";

export async function routeMessage(topic: string, payload: Buffer): Promise<void> {
  const parts = topic.split("/");

  if (parts.length !== 4) {
    console.warn("Invalid MQTT topic");
    return;
  }

  const [, , messageType] = parts;

  switch (messageType) {
    case "heartbeat":
      handleHeartbeat(topic, payload);
      break;

    case "telemetry":
      await handleTelemetry(topic, payload);
      break;

    default:
      console.warn("Unhandled MQTT message type");
  }
}
