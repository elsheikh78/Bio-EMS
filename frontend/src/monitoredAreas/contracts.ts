import { z } from "zod";

const databaseIdSchema = z.number().int().positive();
const databaseFlagSchema = z.number().int().min(0).max(1);
const finiteNumberSchema = z.number().finite();

export const siteSchema = z
  .object({
    id: databaseIdSchema.optional(),
    code: z.string(),
    name: z.string(),
    location: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
    active: databaseFlagSchema.optional(),
  })
  .strict();

export const sitesSchema = z.array(siteSchema);

export const roomSchema = z
  .object({
    id: databaseIdSchema.optional(),
    uuid: z.string(),
    site_id: databaseIdSchema,
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    active: databaseFlagSchema.optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  })
  .strict();

export const roomsSchema = z.array(roomSchema);

export const sensorSchema = z
  .object({
    id: databaseIdSchema.optional(),
    uuid: z.string(),
    room_id: databaseIdSchema,
    device_id: databaseIdSchema,
    channel: z.number().int().nonnegative(),
    code: z.string(),
    name: z.string(),
    sensor_type: z.string(),
    unit: z.string(),
    min_value: finiteNumberSchema.nullable().optional(),
    max_value: finiteNumberSchema.nullable().optional(),
    warning_low: finiteNumberSchema.nullable().optional(),
    alarm_low: finiteNumberSchema.nullable().optional(),
    warning_high: finiteNumberSchema.nullable().optional(),
    alarm_high: finiteNumberSchema.nullable().optional(),
    enabled: databaseFlagSchema.optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  })
  .strict();

export const sensorsSchema = z.array(sensorSchema);

export type Site = z.infer<typeof siteSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Sensor = z.infer<typeof sensorSchema>;
