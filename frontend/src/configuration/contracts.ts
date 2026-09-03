import { z } from "zod";
import { sensorSchema } from "../monitoredAreas/contracts";

export const recipientRoles = [
  "PRIMARY_CONTACT",
  "QUALITY",
  "ENGINEERING",
  "SECURITY",
  "MANAGEMENT",
  "OTHER",
] as const;
export const notificationChannels = [
  "EMAIL",
  "SMS",
  "WHATSAPP",
  "TELEGRAM",
] as const;
export const notificationSeverities = ["WARNING", "CRITICAL"] as const;

const endpointSchema = z
  .object({
    id: z.number().int().positive(),
    channel: z.enum(notificationChannels),
    address: z.string(),
    eligible_severities: z.array(z.enum(notificationSeverities)).min(1).max(2),
  })
  .strict();
export const notificationRecipientSchema = z
  .object({
    id: z.number().int().positive(),
    uuid: z.string().uuid(),
    site_id: z.number().int().positive(),
    display_name: z.string(),
    role: z.enum(recipientRoles),
    status: z.enum(["active", "inactive"]),
    created_at: z.string(),
    updated_at: z.string().nullable(),
    endpoints: z.array(endpointSchema).min(1).max(4),
  })
  .strict();
export const notificationRecipientsSchema = z.array(
  notificationRecipientSchema,
);

const escalationStepSchema = z
  .object({
    id: z.number().int().positive(),
    position: z.number().int().positive(),
    delay_seconds: z.number().int().min(0).max(604_800),
    recipient_role: z.enum(recipientRoles),
    channels: z.array(z.enum(notificationChannels)).min(1).max(4),
  })
  .strict();
export const escalationPolicySchema = z
  .object({
    id: z.number().int().positive(),
    uuid: z.string().uuid(),
    site_id: z.number().int().positive(),
    name: z.string(),
    owner_role: z.enum(recipientRoles),
    eligible_severities: z.array(z.enum(notificationSeverities)).min(1).max(2),
    status: z.enum(["active", "inactive"]),
    created_at: z.string(),
    updated_at: z.string().nullable(),
    steps: z.array(escalationStepSchema).min(1).max(20),
  })
  .strict();
export const escalationPoliciesSchema = z.array(escalationPolicySchema);

export type NotificationRecipient = z.infer<typeof notificationRecipientSchema>;
export type EscalationPolicy = z.infer<typeof escalationPolicySchema>;
export type SensorConfiguration = z.infer<typeof sensorSchema>;
export type NotificationEndpointInput = Omit<
  z.infer<typeof endpointSchema>,
  "id"
>;
export type EscalationStepInput = Omit<
  z.infer<typeof escalationStepSchema>,
  "id"
>;
export interface UpdateSensorThresholdsInput {
  warning_low?: number | null;
  alarm_low?: number | null;
  warning_high?: number | null;
  alarm_high?: number | null;
}
export interface UpdateSensorAlarmDelayInput {
  warning_delay_seconds?: number;
  critical_delay_seconds?: number;
}
export interface CreateNotificationRecipientInput {
  uuid: string;
  site_id: number;
  display_name: string;
  role: (typeof recipientRoles)[number];
  endpoints: NotificationEndpointInput[];
}
export type UpdateNotificationRecipientInput = Partial<
  Pick<CreateNotificationRecipientInput, "display_name" | "role" | "endpoints">
>;
export interface CreateEscalationPolicyInput {
  uuid: string;
  site_id: number;
  name: string;
  owner_role: (typeof recipientRoles)[number];
  eligible_severities: Array<(typeof notificationSeverities)[number]>;
  steps: EscalationStepInput[];
}
export type UpdateEscalationPolicyInput = Partial<
  Pick<
    CreateEscalationPolicyInput,
    "name" | "owner_role" | "eligible_severities" | "steps"
  >
>;
