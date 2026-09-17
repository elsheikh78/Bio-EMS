import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "OPERATOR", "VIEWER"]);

export const authenticatedUserSchema = z
  .object({
    id: z.number().int().positive(),
    username: z.string().min(1),
    role: userRoleSchema,
  })
  .strict();

export const loginRequestSchema = z
  .object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
  })
  .strict();

export const loginResponseSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.literal("bearer"),
    expires_in: z.number().int().positive().finite(),
    password_change_required: z.boolean(),
    user: authenticatedUserSchema,
  })
  .strict();

export const currentUserResponseSchema = z
  .object({ user: authenticatedUserSchema })
  .strict();

export const backendErrorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({ code: z.string().min(1), message: z.string().min(1) })
      .strict(),
  })
  .strict();

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = Omit<
  z.infer<typeof loginResponseSchema>,
  "password_change_required"
> & {
  password_change_required?: boolean;
};
export type UserRole = z.infer<typeof userRoleSchema>;
