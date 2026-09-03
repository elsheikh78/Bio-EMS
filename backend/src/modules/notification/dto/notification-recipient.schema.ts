import { z } from "zod";

export const NOTIFICATION_RECIPIENT_ROLES = [
  "PRIMARY_CONTACT",
  "QUALITY",
  "ENGINEERING",
  "SECURITY",
  "MANAGEMENT",
  "OTHER",
] as const;
export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "TELEGRAM"] as const;
export const NOTIFICATION_SEVERITIES = ["WARNING", "CRITICAL"] as const;

const e164 = z.string().regex(/^\+[1-9]\d{7,14}$/, "address must use E.164 format");
const endpointSchema = z
  .object({
    channel: z.enum(NOTIFICATION_CHANNELS),
    address: z.string().trim().min(1).max(320),
    eligible_severities: z.array(z.enum(NOTIFICATION_SEVERITIES)).min(1).max(2),
  })
  .strict()
  .superRefine((endpoint, context) => {
    if (new Set(endpoint.eligible_severities).size !== endpoint.eligible_severities.length) {
      context.addIssue({
        code: "custom",
        path: ["eligible_severities"],
        message: "Duplicate severity",
      });
    }
    const valid =
      endpoint.channel === "EMAIL"
        ? z.email().safeParse(endpoint.address)
        : endpoint.channel === "TELEGRAM"
          ? z
              .string()
              .regex(/^-?\d{1,20}$/, "address must be a Telegram Chat ID")
              .safeParse(endpoint.address)
          : e164.safeParse(endpoint.address);
    if (!valid.success) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: valid.error.issues[0]?.message ?? "Invalid address",
      });
    }
  });

const endpointsSchema = z
  .array(endpointSchema)
  .min(1)
  .max(4)
  .superRefine((endpoints, context) => {
    const channels = endpoints.map(({ channel }) => channel);
    if (new Set(channels).size !== channels.length) {
      context.addIssue({ code: "custom", message: "Duplicate recipient channel" });
    }
  });

export const createNotificationRecipientSchema = z
  .object({
    uuid: z.string().trim().uuid(),
    site_id: z.number().int().positive(),
    display_name: z.string().trim().min(1).max(200),
    role: z.enum(NOTIFICATION_RECIPIENT_ROLES),
    endpoints: endpointsSchema,
  })
  .strict();

export const updateNotificationRecipientSchema = z
  .object({
    display_name: z.string().trim().min(1).max(200).optional(),
    role: z.enum(NOTIFICATION_RECIPIENT_ROLES).optional(),
    endpoints: endpointsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one recipient field is required",
  });

export const updateNotificationRecipientStatusSchema = z
  .object({ status: z.enum(["active", "inactive"]) })
  .strict();
export const notificationRecipientParamsSchema = z
  .object({ recipientUuid: z.string().trim().uuid() })
  .strict();
export const notificationRecipientListQuerySchema = z
  .object({ site_id: z.coerce.number().int().positive() })
  .strict();

export type NotificationRecipientEndpointInput = z.infer<typeof endpointSchema>;
export type CreateNotificationRecipientInput = z.infer<typeof createNotificationRecipientSchema>;
export type UpdateNotificationRecipientInput = z.infer<typeof updateNotificationRecipientSchema>;
export type UpdateNotificationRecipientStatusInput = z.infer<
  typeof updateNotificationRecipientStatusSchema
>;
