import { z } from "zod";

const siteId = z.coerce.number().int().positive();
const limit = z.coerce.number().int().min(1).max(500).default(100);

export const customerAuditEventQuerySchema = z
  .object({
    site_id: siteId,
    limit,
  })
  .strict();

export const platformAuditEventQuerySchema = z
  .object({
    site_id: siteId.optional(),
    limit,
  })
  .strict();

export type CustomerAuditEventQuery = z.infer<typeof customerAuditEventQuerySchema>;
export type PlatformAuditEventQuery = z.infer<typeof platformAuditEventQuerySchema>;
