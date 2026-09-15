import { z } from "zod";

export const issueOwnerSupportGrantSchema = z
  .object({
    site_id: z.number().int().positive().nullable().optional(),
    reason: z.string().trim().min(8).max(500),
    duration_minutes: z.number().int().min(1).max(480),
  })
  .strict();

export const revokeOwnerSupportGrantSchema = z
  .object({
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

export const ownerSupportGrantParamsSchema = z
  .object({
    grantId: z.string().uuid(),
  })
  .strict();
