import { z } from "zod";
import { SENSOR_CALIBRATION_STATUSES } from "../../../domain/enums/sensor-calibration-status";
import { SENSOR_PRODUCT_GRADES } from "../../../domain/enums/sensor-product-grade";

const requiredString = (field: string, maxLength: number) =>
  z.string().trim().min(1, `${field} is required`).max(maxLength, `${field} is too long`);

const optionalString = (field: string, maxLength: number) =>
  requiredString(field, maxLength).optional();

const optionalIsoDateTime = (field: string) =>
  z.iso.datetime({ offset: true, error: `${field} must be an ISO 8601 datetime` }).optional();

export const createSensorSchema = z
  .object({
    uuid: z.string().trim().uuid("uuid must be a valid UUID"),
    room_id: z.number().int().positive(),
    device_id: z.number().int().positive(),
    channel: z.number().int().nonnegative(),
    code: requiredString("code", 100),
    name: requiredString("name", 200),
    sensor_type: requiredString("sensor_type", 100),
    unit: requiredString("unit", 50),
    min_value: z.number().finite().optional(),
    max_value: z.number().finite().optional(),
    warning_low: z.number().finite().optional(),
    alarm_low: z.number().finite().optional(),
    warning_high: z.number().finite().optional(),
    alarm_high: z.number().finite().optional(),
    enabled: z.union([z.literal(0), z.literal(1)]).optional(),
    product_grade: z.enum(SENSOR_PRODUCT_GRADES).optional(),
    hardware_model: optionalString("hardware_model", 100),
    installation_date: z.iso
      .date({ error: "installation_date must be an ISO 8601 date" })
      .optional(),
    calibration_status: z.enum(SENSOR_CALIBRATION_STATUSES).optional(),
    last_calibrated_at: optionalIsoDateTime("last_calibrated_at"),
    calibration_due_at: optionalIsoDateTime("calibration_due_at"),
    calibration_offset: z.number().finite().optional(),
    certificate_reference: optionalString("certificate_reference", 200),
  })
  .strict()
  .superRefine((sensor, context) => {
    if (
      sensor.last_calibrated_at &&
      sensor.calibration_due_at &&
      Date.parse(sensor.calibration_due_at) < Date.parse(sensor.last_calibrated_at)
    ) {
      context.addIssue({
        code: "custom",
        path: ["calibration_due_at"],
        message: "calibration_due_at cannot precede last_calibrated_at",
      });
    }
  });

export const sensorListQuerySchema = z.object({}).strict();

export const sensorThresholdParamsSchema = z
  .object({ sensorUuid: z.string().trim().uuid("sensorUuid must be a valid UUID") })
  .strict();

const thresholdValue = z.number().finite().nullable().optional();

export const updateSensorThresholdsSchema = z
  .object({
    warning_low: thresholdValue,
    alarm_low: thresholdValue,
    warning_high: thresholdValue,
    alarm_high: thresholdValue,
  })
  .strict()
  .refine((thresholds) => Object.values(thresholds).some((value) => value !== undefined), {
    message: "At least one threshold is required",
  });

export type CreateSensorInput = z.infer<typeof createSensorSchema>;
export type UpdateSensorThresholdsInput = z.infer<typeof updateSensorThresholdsSchema>;
