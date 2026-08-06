import { telemetrySchema } from "../schemas/telemetry.schema";
import { TelemetryService } from "../services/telemetry.service";

const telemetryService = new TelemetryService();

export async function handleTelemetry(topic: string, payload: Buffer): Promise<void> {
  try {
    const message = telemetrySchema.parse(JSON.parse(payload.toString()));

    await telemetryService.process(topic, message);
  } catch (error) {
    console.error("Telemetry Error:", error);
  }
}
