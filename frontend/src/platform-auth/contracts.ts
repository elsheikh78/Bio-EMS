import { z } from "zod";

export const platformPrincipalSchema = z
  .object({
    kind: z.literal("platform"),
    type: z.literal("SYSTEM_OWNER"),
    id: z.string().min(1),
    username: z.string().min(1),
  })
  .strict();

export const platformLoginRequestSchema = z
  .object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
    code: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
  })
  .strict();

export const platformAuthenticatedResponseSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.literal("bearer"),
    expires_in: z.number().int().positive().finite(),
    principal: platformPrincipalSchema,
  })
  .strict();

export const platformMfaEnrollmentRequiredResponseSchema = z
  .object({
    mfa_enrollment_required: z.literal(true),
    enrollment_token: z.string().min(1),
    token_type: z.literal("bearer"),
    expires_in: z.number().int().positive().max(300).finite(),
  })
  .strict();

export const platformLoginResponseSchema = z.union([
  platformAuthenticatedResponseSchema,
  platformMfaEnrollmentRequiredResponseSchema,
]);

export const ownerMfaEnrollmentResponseSchema = z
  .object({
    secret: z.string().min(16),
    otpauth_uri: z.string().url(),
  })
  .strict();

export const currentPlatformPrincipalResponseSchema = z
  .object({ principal: platformPrincipalSchema })
  .strict();

export type PlatformPrincipal = z.infer<typeof platformPrincipalSchema>;
export type PlatformLoginRequest = z.infer<typeof platformLoginRequestSchema>;
export type PlatformLoginResponse = z.infer<typeof platformLoginResponseSchema>;
export type OwnerMfaEnrollmentResponse = z.infer<typeof ownerMfaEnrollmentResponseSchema>;
