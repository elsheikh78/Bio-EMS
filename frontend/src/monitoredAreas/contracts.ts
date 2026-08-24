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
    product_grade: z.enum(["STANDARD", "ADVANCED"]).nullable().optional(),
    hardware_model: z.string().nullable().optional(),
    installation_date: z.string().nullable().optional(),
    calibration_status: z
      .enum(["NOT_CALIBRATED", "VALID", "DUE", "EXPIRED"])
      .nullable()
      .optional(),
    last_calibrated_at: z.string().nullable().optional(),
    calibration_due_at: z.string().nullable().optional(),
    calibration_offset: finiteNumberSchema.nullable().optional(),
    certificate_reference: z.string().nullable().optional(),
    min_value: finiteNumberSchema.nullable().optional(),
    max_value: finiteNumberSchema.nullable().optional(),
    warning_low: finiteNumberSchema.nullable().optional(),
    alarm_low: finiteNumberSchema.nullable().optional(),
    warning_high: finiteNumberSchema.nullable().optional(),
    alarm_high: finiteNumberSchema.nullable().optional(),
    warning_delay_seconds: z.number().int().min(0).max(86_400).optional(),
    critical_delay_seconds: z.number().int().min(0).max(86_400).optional(),
    enabled: databaseFlagSchema.optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  })
  .strict();

export const sensorsSchema = z.array(sensorSchema);

export const calibrationRecordSchema = z
  .object({
    id: z.number().int(),
    sensor_id: z.number().int(),
    sensor_uuid: z.string(),
    result: z.enum(["PASS", "FAIL"]),
    performed_at: z.string(),
    due_at: z.string().nullable(),
    offset: finiteNumberSchema.nullable(),
    certificate_reference: z.string().nullable(),
    notes: z.string().nullable(),
    performed_by_user_id: z.number().int(),
    performed_by_username: z.string(),
    created_at: z.string(),
  })
  .strict();

export const calibrationRecordsSchema = z.array(calibrationRecordSchema);

export type Site = z.infer<typeof siteSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Sensor = z.infer<typeof sensorSchema>;
export type CalibrationRecord = z.infer<typeof calibrationRecordSchema>;

export interface CreateCalibrationRecordInput {
  result: "PASS" | "FAIL";
  performed_at: string;
  due_at?: string;
  offset?: number;
  certificate_reference?: string;
  notes?: string;
}
