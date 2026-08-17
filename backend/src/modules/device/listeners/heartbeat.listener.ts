import { heartbeatSchema } from "../dto/heartbeat.schema";
import { HeartbeatService } from "../services/heartbeat.service";

const service = new HeartbeatService();

export function handleHeartbeat(topic: string, payload: Buffer): void {
  try {
    service.process(topic, heartbeatSchema.parse(JSON.parse(payload.toString())));
  } catch {
    console.error("Heartbeat Error: invalid payload");
  }
}
