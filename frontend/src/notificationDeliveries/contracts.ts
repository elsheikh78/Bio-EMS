import { z } from "zod";

export const deliveryStatuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "RETRY_WAIT",
  "FAILED",
  "DEAD_LETTER",
  "CANCELLED",
] as const;

const attemptSchema = z.object({
  id: z.number().int().positive(),
  attempt_number: z.number().int().positive(),
  phase: z.enum(["START", "RESULT"]),
  status: z.string(),
  provider: z.string(),
  provider_message_id: z.string().nullable(),
  error_code: z.string().nullable(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
});

export const notificationDeliverySchema = z
  .object({
    id: z.number().int().positive(),
    uuid: z.string().uuid(),
    site_id: z.number().int().positive(),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]),
    severity: z.enum(["WARNING", "CRITICAL"]),
    status: z.enum(deliveryStatuses),
    attempt_count: z.number().int().nonnegative(),
    max_attempts: z.number().int().positive(),
    next_attempt_at: z.string(),
    provider_message_id: z.string().nullable(),
    last_error_code: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string().nullable(),
    recipient_name: z.string(),
    recipient_role: z.string(),
    event_type: z.string(),
    source_id: z.string(),
    attempts: z.array(attemptSchema),
  })
  .passthrough();

export const notificationDeliveriesEnvelopeSchema = z.object({
  deliveries: z.array(notificationDeliverySchema),
});

export type NotificationDelivery = z.infer<typeof notificationDeliverySchema>;
export type DeliveryStatus = (typeof deliveryStatuses)[number];
