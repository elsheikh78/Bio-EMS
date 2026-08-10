import { z } from "zod";

const requiredString = (field: string, maxLength: number) =>
  z
    .string({ error: `${field} must be a string` })
    .trim()
    .min(1, `${field} is required`)
    .max(maxLength, `${field} is too long`);

const optionalString = (field: string, maxLength: number) =>
  requiredString(field, maxLength).optional();

export const createDeviceSchema = z
  .object({
    uuid: z.string().trim().uuid("uuid must be a valid UUID"),
    device_id: requiredString("device_id", 100),
    site_id: z.number().int().positive(),
    device_type: requiredString("device_type", 100),
    protocol: requiredString("protocol", 50),
    manufacturer: optionalString("manufacturer", 100),
    model: optionalString("model", 100),
    firmware_version: optionalString("firmware_version", 100),
  })
  .strict();

export const updateDeviceSchema = z
  .object({
    device_type: optionalString("device_type", 100),
    protocol: optionalString("protocol", 50),
    manufacturer: optionalString("manufacturer", 100),
    model: optionalString("model", 100),
    firmware_version: optionalString("firmware_version", 100),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });

export const deviceParamsSchema = z
  .object({
    deviceId: requiredString("deviceId", 100),
  })
  .strict();

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeviceParams = z.infer<typeof deviceParamsSchema>;
