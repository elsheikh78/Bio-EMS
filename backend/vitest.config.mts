import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}", "database/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: false,
  },
});
