import { z } from "zod";

export const alarmSchema = z
  .object({
    id: z.number().int().positive(),
    sensor_id: z.number().int().positive(),
    type: z.string().min(1),
    severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
    status: z.enum(["TRIGGERED", "ACKNOWLEDGED", "RECOVERED"]),
    trigger_value: z.number().finite(),
    trigger_time: z.string().nullable().optional(),
    acknowledged_time: z.string().nullable().optional(),
    recovered_time: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
  })
  .strict();

export const alarmsSchema = z.array(alarmSchema);
export const acknowledgementSchema = z
  .object({ success: z.literal(true) })
  .strict();
export type Alarm = z.infer<typeof alarmSchema>;
