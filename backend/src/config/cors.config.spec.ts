import { describe, expect, it } from "vitest";
import { CorsConfigurationError, loadCorsConfig } from "./cors.config";

describe("CORS configuration", () => {
  it("uses only the documented development origin outside production", () => {
    expect(loadCorsConfig({ NODE_ENV: "development" })).toEqual({
      allowedOrigins: ["http://localhost:5173"],
    });
  });

  it("fails closed when production has no allowlist", () => {
    expect(loadCorsConfig({ NODE_ENV: "production" })).toEqual({ allowedOrigins: [] });
  });

  it("parses and deduplicates exact origins", () => {
    expect(
      loadCorsConfig({
        NODE_ENV: "production",
        BIOEMS_CORS_ALLOWED_ORIGINS: "https://ems.example.com,https://ems.example.com",
      })
    ).toEqual({ allowedOrigins: ["https://ems.example.com"] });
  });

  it.each(["*", "ems.example.com", "https://ems.example.com/path", "https://user@ems.example.com"])(
    "rejects unsafe origin configuration: %s",
    (value) => {
      expect(() =>
        loadCorsConfig({ NODE_ENV: "production", BIOEMS_CORS_ALLOWED_ORIGINS: value })
      ).toThrow(CorsConfigurationError);
    }
  );
});
