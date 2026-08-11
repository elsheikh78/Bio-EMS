import { z } from "zod";

const publicEnvironmentSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), {
      message: "VITE_API_BASE_URL must not end with a slash",
    }),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function loadEnvironment(
  input: Record<string, unknown>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(input);
}

export function getEnvironment(): PublicEnvironment {
  return loadEnvironment(import.meta.env);
}
