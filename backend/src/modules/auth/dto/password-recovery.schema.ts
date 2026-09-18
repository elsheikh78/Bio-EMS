import { z } from "zod";

const username = z.string().trim().toLowerCase().min(3).max(64);
const password = z.string().min(1).max(72);

export const forgotPasswordSchema = z.object({ username }).strict();
export const changePasswordSchema = z
  .object({ current_password: password, new_password: password })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
