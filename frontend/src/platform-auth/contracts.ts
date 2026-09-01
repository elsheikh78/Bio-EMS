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
  })
  .strict();

export const platformLoginResponseSchema = z
  .object({
    access_token: z.string().min(1),
    token_type: z.literal("bearer"),
    expires_in: z.number().int().positive().finite(),
    principal: platformPrincipalSchema,
  })
  .strict();

export const currentPlatformPrincipalResponseSchema = z
  .object({ principal: platformPrincipalSchema })
  .strict();

export type PlatformPrincipal = z.infer<typeof platformPrincipalSchema>;
export type PlatformLoginRequest = z.infer<typeof platformLoginRequestSchema>;
