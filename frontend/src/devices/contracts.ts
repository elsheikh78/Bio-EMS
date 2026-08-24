import { z } from "zod";

export const deviceSchema = z
  .object({
    id: z.number().int().positive().optional(),
    uuid: z.string().uuid(),
    device_id: z.string().min(1),
    site_id: z.number().int().positive(),
    device_type: z.string().min(1),
    protocol: z.string().min(1),
    manufacturer: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    firmware_version: z.string().nullable().optional(),
    status: z.enum(["pending", "active", "disabled"]),
    activated: z.union([z.literal(0), z.literal(1)]),
    last_seen_at: z.string().nullable().optional(),
    last_heartbeat_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .strict();
export const deviceHealthSchema = z
  .object({
    device_id: z.string().min(1),
    lifecycle_status: z.string().min(1),
    communication_status: z.enum([
      "ONLINE",
      "STALE",
      "OFFLINE",
      "NEVER_SEEN",
      "NOT_OPERATIONAL",
    ]),
    last_seen_at: z.string().nullable(),
    last_heartbeat_at: z.string().nullable(),
    seconds_since_seen: z.number().int().nonnegative().nullable(),
    stale_after_seconds: z.number().int().positive(),
    offline_after_seconds: z.number().int().positive(),
  })
  .strict();
export const devicesSchema = z.array(deviceSchema);
export type Device = z.infer<typeof deviceSchema>;
export type DeviceUpdate = Partial<
  Pick<
    Device,
    "device_type" | "protocol" | "manufacturer" | "model" | "firmware_version"
  >
>;
