import { z } from "zod";

export const notificationDeliveryStatuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "RETRY_WAIT",
  "FAILED",
  "DEAD_LETTER",
  "CANCELLED",
] as const;

export const notificationDeliveryListQuerySchema = z
  .object({
    site_id: z.coerce.number().int().positive(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
    status: z.enum(notificationDeliveryStatuses).optional(),
  })
  .strict();
