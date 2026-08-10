import { z } from "zod";
import { normalizeUsername } from "../../../entities/User";

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9._-]+$/)
  );

const passwordSchema = z
  .string()
  .min(1)
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72);

export const loginSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
