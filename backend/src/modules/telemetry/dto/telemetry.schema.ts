import { z } from "zod";

export const telemetrySensorSchema = z.object({
  channel: z.number().int().positive(),
  value: z.number(),
});

export const telemetrySchema = z.object({
  protocolVersion: z.string(),

  timestamp: z.string().datetime(),

  battery: z.number().min(0).max(100),

  signal: z.number(),

  mode: z.enum(["LIVE", "REPLAY"]).optional(),

  sensors: z.array(telemetrySensorSchema).min(1),
});

export type TelemetryPayload = z.infer<typeof telemetrySchema>;
