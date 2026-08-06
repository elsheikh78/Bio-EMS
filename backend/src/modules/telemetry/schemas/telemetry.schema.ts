import { z } from "zod";

export const telemetrySensorSchema = z.object({
  channel: z.number().int().positive(),

  value: z.number(),
});

export const telemetrySchema = z.object({
  protocolVersion: z.string().min(1),

  timestamp: z.string().datetime(),

  battery: z.number().min(0).max(100),

  signal: z.number(),

  sensors: z.array(telemetrySensorSchema).min(1),
});

export type TelemetryPayload = z.infer<typeof telemetrySchema>;
