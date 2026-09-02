import { z } from "zod";

export const createPlatformCustomerSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(200),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    createdAt: z.string().datetime(),
  })
  .strict();

export const createPlatformLicenseSchema = z
  .object({
    customerId: z.number().int().positive(),
    siteId: z.number().int().positive().nullable().optional(),
    licenseKeyReference: z.string().trim().min(1).max(128),
    edition: z.string().trim().min(1).max(64),
    status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]),
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable().optional(),
    updateEntitlement: z.enum(["NONE", "FREE", "PAID"]),
    recordedAt: z.string().datetime(),
  })
  .strict();

export const createPlatformMaintenanceSchema = z
  .object({
    customerId: z.number().int().positive(),
    siteId: z.number().int().positive().nullable().optional(),
    eventType: z.enum(["MAINTENANCE", "CALIBRATION", "SUPPORT", "UPDATE"]),
    dueAt: z.string().datetime().nullable().optional(),
    status: z.enum(["OPEN", "SCHEDULED", "COMPLETE", "CANCELLED"]),
    reference: z.string().trim().min(1).max(128),
    note: z.string().trim().max(1000).nullable().optional(),
    recordedAt: z.string().datetime(),
  })
  .strict();

export const platformRecordParamsSchema = z.object({ id: z.string().regex(/^\d+$/) }).strict();

export const platformCustomerParamsSchema = z
  .object({ customerId: z.string().regex(/^[1-9]\d*$/) })
  .strict();

export const platformCustomerAdminParamsSchema = z
  .object({
    customerId: z.string().regex(/^[1-9]\d*$/),
    userId: z.string().regex(/^[1-9]\d*$/),
  })
  .strict();

export const createPlatformCustomerAdminSchema = z
  .object({
    username: z.string().trim().min(3).max(64),
    email: z.string().trim().email().nullable().optional(),
    password: z.string().min(12).max(72),
  })
  .strict();

export const updatePlatformCustomerAdminStatusSchema = z
  .object({ status: z.enum(["active", "disabled"]) })
  .strict();

export const updatePlatformCustomerAdminPasswordSchema = z
  .object({ password: z.string().min(12).max(72) })
  .strict();

export const updatePlatformLicenseSchema = z
  .object({
    siteId: z.number().int().positive().nullable(),
    status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]),
    expiresAt: z.string().datetime().nullable(),
    updateEntitlement: z.enum(["NONE", "FREE", "PAID"]),
  })
  .strict();

export const updatePlatformMaintenanceSchema = z
  .object({
    dueAt: z.string().datetime().nullable(),
    status: z.enum(["OPEN", "SCHEDULED", "COMPLETE", "CANCELLED"]),
    note: z.string().trim().max(1000).nullable(),
  })
  .strict();
