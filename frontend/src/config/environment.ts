import { z } from "zod";

const publicEnvironmentSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .refine((value) => !value.endsWith("/"), {
      message: "VITE_API_BASE_URL must not end with a slash",
    })
    .superRefine((value, context) => {
      let url: URL;

      try {
        url = new URL(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "VITE_API_BASE_URL must be a valid absolute URL",
        });
        return;
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        context.addIssue({
          code: "custom",
          message: "VITE_API_BASE_URL must use HTTP or HTTPS",
        });
      }
      if (url.username || url.password) {
        context.addIssue({
          code: "custom",
          message: "VITE_API_BASE_URL must not include credentials",
        });
      }
      if (url.search) {
        context.addIssue({
          code: "custom",
          message: "VITE_API_BASE_URL must not include a query string",
        });
      }
      if (url.hash) {
        context.addIssue({
          code: "custom",
          message: "VITE_API_BASE_URL must not include a fragment",
        });
      }
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
