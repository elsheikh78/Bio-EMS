import { z } from "zod";

const databaseIdSchema = z.number().int().positive();

export const platformCustomerSchema = z
  .object({
    id: databaseIdSchema,
    code: z.string(),
    name: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    createdAt: z.string(),
    createdBy: z.string(),
  })
  .strict();

export const platformSiteSchema = z
  .object({
    id: databaseIdSchema,
    code: z.string(),
    name: z.string(),
    location: z.string().nullable(),
    timezone: z.string().nullable(),
    active: z.number().int().min(0).max(1),
  })
  .strict();

export const platformLicenseSummarySchema = z
  .object({
    id: databaseIdSchema,
    customerId: databaseIdSchema,
    siteId: databaseIdSchema.nullable(),
    licenseKeyReference: z.string(),
    edition: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]),
    startsAt: z.string(),
    expiresAt: z.string().nullable(),
    updateEntitlement: z.enum(["NONE", "FREE", "PAID"]),
  })
  .strict();

export const platformServiceEventSummarySchema = z
  .object({
    id: databaseIdSchema,
    customerId: databaseIdSchema,
    siteId: databaseIdSchema.nullable(),
    eventType: z.enum(["MAINTENANCE", "CALIBRATION", "SUPPORT", "UPDATE"]),
    dueAt: z.string().nullable(),
    status: z.enum(["OPEN", "SCHEDULED", "COMPLETE", "CANCELLED"]),
    reference: z.string(),
    note: z.string().nullable(),
  })
  .strict();

export const platformCommercialEventSchema = z
  .object({
    id: databaseIdSchema,
    eventType: z.string(),
    entityType: z.string(),
    entityId: databaseIdSchema,
    occurredAt: z.string(),
    actorIdentity: z.string(),
  })
  .strict();

export const platformOperationsOverviewSchema = z
  .object({
    customers: z.array(platformCustomerSchema),
    sites: z.array(platformSiteSchema),
    licenses: z.array(platformLicenseSummarySchema),
    serviceEvents: z.array(platformServiceEventSummarySchema),
    commercialEvents: z.array(platformCommercialEventSchema),
  })
  .strict();

export const createPlatformCustomerRequestSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(200),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    createdAt: z.string().datetime(),
  })
  .strict();

export const createPlatformCustomerResponseSchema = z
  .object({ success: z.literal(true), id: databaseIdSchema })
  .strict();

export type PlatformCustomer = z.infer<typeof platformCustomerSchema>;
export type PlatformOperationsOverview = z.infer<
  typeof platformOperationsOverviewSchema
>;
export type CreatePlatformCustomerRequest = z.infer<
  typeof createPlatformCustomerRequestSchema
>;
