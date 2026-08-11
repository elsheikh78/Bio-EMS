import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "../../../entities/User";

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9._-]+$/);

const email = z.string().trim().email().max(254).nullable();
const role = z.enum(USER_ROLES);
const status = z.enum(USER_STATUSES);
const password = z.string().min(1).max(72);

export const userParamsSchema = z
  .object({
    user_id: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/),
  })
  .strict();

export const createUserSchema = z
  .object({ username, email: email.optional(), password, role })
  .strict();

export const updateUserSchema = z
  .object({ email: email.optional(), role: role.optional() })
  .strict()
  .refine((input) => Object.keys(input).length > 0);

export const updateUserStatusSchema = z.object({ status }).strict();
export const updateUserPasswordSchema = z.object({ password }).strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
