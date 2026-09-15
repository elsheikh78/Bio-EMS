import { z } from "zod";

export const confirmOwnerMfaSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export type ConfirmOwnerMfaInput = z.infer<typeof confirmOwnerMfaSchema>;
