import { z } from "zod";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENT_ROLES,
  NOTIFICATION_SEVERITIES,
} from "./notification-recipient.schema";

const unique = <T>(values: T[]) => new Set(values).size === values.length;
const stepsSchema = z
  .array(
    z
      .object({
        position: z.number().int().positive(),
        delay_seconds: z.number().int().min(0).max(604_800),
        recipient_role: z.enum(NOTIFICATION_RECIPIENT_ROLES),
        channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).max(3),
      })
      .strict()
      .refine((step) => unique(step.channels), { message: "Duplicate channel" })
  )
  .min(1)
  .max(20)
  .superRefine((steps, context) => {
    const ordered = [...steps].sort((a, b) => a.position - b.position);
    if (ordered.some((step, index) => step.position !== index + 1))
      context.addIssue({ code: "custom", message: "Step positions must be contiguous" });
    if (
      ordered.some(
        (step, index) => index > 0 && step.delay_seconds <= ordered[index - 1]!.delay_seconds
      )
    )
      context.addIssue({ code: "custom", message: "Step delays must increase strictly" });
  });

const policyFields = {
  name: z.string().trim().min(1).max(200),
  owner_role: z.enum(NOTIFICATION_RECIPIENT_ROLES),
  eligible_severities: z
    .array(z.enum(NOTIFICATION_SEVERITIES))
    .min(1)
    .max(2)
    .refine(unique, { message: "Duplicate severity" }),
  steps: stepsSchema,
};
export const createEscalationPolicySchema = z
  .object({ uuid: z.string().trim().uuid(), site_id: z.number().int().positive(), ...policyFields })
  .strict();
export const updateEscalationPolicySchema = z
  .object({
    name: policyFields.name.optional(),
    owner_role: policyFields.owner_role.optional(),
    eligible_severities: policyFields.eligible_severities.optional(),
    steps: policyFields.steps.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one policy field is required",
  });
export const updateEscalationPolicyStatusSchema = z
  .object({ status: z.enum(["active", "inactive"]) })
  .strict();
export const escalationPolicyParamsSchema = z
  .object({ policyUuid: z.string().trim().uuid() })
  .strict();
export const escalationPolicyListQuerySchema = z
  .object({ site_id: z.coerce.number().int().positive() })
  .strict();

export type CreateEscalationPolicyInput = z.infer<typeof createEscalationPolicySchema>;
export type UpdateEscalationPolicyInput = z.infer<typeof updateEscalationPolicySchema>;
export type UpdateEscalationPolicyStatusInput = z.infer<typeof updateEscalationPolicyStatusSchema>;
