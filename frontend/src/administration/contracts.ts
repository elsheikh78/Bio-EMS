import { z } from "zod";
export const userRoles = ["ADMIN", "OPERATOR", "VIEWER"] as const;
export const userSchema = z
  .object({
    id: z.number().int().positive(),
    username: z.string(),
    email: z.string().nullable(),
    role: z.enum(userRoles),
    status: z.enum(["active", "disabled"]),
    created_at: z.string(),
    updated_at: z.string().nullable(),
  })
  .strict();
export const usersSchema = z.array(userSchema);
const structuredValues = z.record(z.string(), z.unknown());
export const auditEventSchema = z
  .object({
    id: z.string(),
    occurredAt: z.string().optional(),
    createdAt: z.string(),
    actor: z
      .object({
        kind: z.enum(["CUSTOMER_USER", "PLATFORM"]),
        id: z.string(),
        username: z.string(),
        role: z.string(),
      })
      .strict(),
    action: z.string(),
    target: z.object({ type: z.string(), id: z.string() }).strict().optional(),
    siteId: z.number().int().positive().optional(),
    result: z.enum(["SUCCESS", "DENIED", "FAILED"]),
    previousValues: structuredValues.optional(),
    newValues: structuredValues.optional(),
    requestContext: z
      .object({
        requestId: z.string().optional(),
        sessionId: z.string().optional(),
        correlationId: z.string().optional(),
        source: z.string(),
      })
      .strict(),
    reason: z.string().optional(),
  })
  .strict();
export const auditEventsResponseSchema = z
  .object({ events: z.array(auditEventSchema) })
  .strict();
export type ManagedUser = z.infer<typeof userSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export interface CreateUserInput {
  username: string;
  email?: string | null;
  password: string;
  role: (typeof userRoles)[number];
}
export interface UpdateUserInput {
  email?: string | null;
  role?: (typeof userRoles)[number];
}
