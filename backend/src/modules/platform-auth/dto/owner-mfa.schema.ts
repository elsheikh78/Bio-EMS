import { z } from "zod";

export const confirmOwnerMfaSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export const resetOwnerMfaSchema = z
  .object({
    current_password: z.string().min(1),
    current_code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export type ConfirmOwnerMfaInput = z.infer<typeof confirmOwnerMfaSchema>;
export type ResetOwnerMfaInput = z.infer<typeof resetOwnerMfaSchema>;
