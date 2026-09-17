import { z } from "zod";

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9._-]+$/);

const password = z.string().min(1).max(72);

export const platformLoginSchema = z
  .object({
    username,
    password,
    code: z
      .string()
      .regex(/^\\d{6}$/)
      .optional(),
  })
  .strict();

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;
