import { z } from "zod";

export const installationStatusSchema = z.enum([
  "DRAFT",
  "VALIDATED",
  "PENDING_DELIVERY",
  "SENT",
  "CONFIG_ACTIVE",
  "CUSTOMER_ACCEPTANCE_PENDING",
  "COMMISSIONED",
  "CORRECTION_REQUIRED",
]);
const counts = z
  .object({
    sites: z.number().int().nonnegative(),
    areas: z.number().int().nonnegative(),
    telemetries: z.number().int().nonnegative(),
    devices: z.number().int().nonnegative(),
    mappings: z.number().int().nonnegative(),
  })
  .strict();
export const installationSummarySchema = z
  .object({
    id: z.number().int().positive(),
    uuid: z.string().uuid(),
    customerId: z.number().int().positive(),
    customerName: z.string(),
    status: installationStatusSchema,
    activeRevisionId: z.number().int().positive().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    latestRevision: z.number().int().positive(),
    latestSnapshot: z.record(z.string(), z.unknown()),
    summary: counts,
  })
  .strict();
export const installationListSchema = z.array(installationSummarySchema);
export const installationCreateResponseSchema = z
  .object({
    uuid: z.string().uuid(),
    revision: z.number().int().positive(),
    checksum: z.string().length(64),
  })
  .strict();

export type InstallationSummary = z.infer<typeof installationSummarySchema>;
