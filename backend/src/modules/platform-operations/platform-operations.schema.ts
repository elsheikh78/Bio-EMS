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
