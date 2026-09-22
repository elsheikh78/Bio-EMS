import { z } from "zod";

export const platformBackupScheduleInputSchema = z
  .object({
    enabled: z.boolean(),
    intervalHours: z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(168)]),
    retentionCount: z.number().int().min(1).max(30),
  })
  .strict();

export type PlatformBackupScheduleInput = z.infer<typeof platformBackupScheduleInputSchema>;
