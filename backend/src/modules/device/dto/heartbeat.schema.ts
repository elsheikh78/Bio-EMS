import { z } from "zod";

export const heartbeatSchema = z
  .object({
    sent_at: z.iso.datetime({ offset: true }),
    uptime_seconds: z.number().int().nonnegative().optional(),
  })
  .strict();

export type HeartbeatPayload = z.infer<typeof heartbeatSchema>;
