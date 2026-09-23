import { z } from "zod";

export const heartbeatSchema = z
  .object({
    sent_at: z.iso.datetime({ offset: true }),
    uptime_seconds: z.number().int().nonnegative().optional(),
    platform_binding_id: z.string().uuid().optional(),
    hardware_uid: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-F0-9]{12,32}$/)
      .optional(),
    firmware_version: z.string().trim().min(1).max(64).optional(),
    protocol_version: z.string().trim().min(1).max(32).optional(),
  })
  .strict();

export type HeartbeatPayload = z.infer<typeof heartbeatSchema>;
