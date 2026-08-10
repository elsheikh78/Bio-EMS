import { describe, expect, it, vi } from "vitest";
import { JwtConfigurationError, loadJwtConfig } from "./jwt.config";

const VALID_SECRET = "s".repeat(32);

describe("JWT configuration", () => {
  it("loads approved defaults without modifying the secret", () => {
    const secret = ` ${VALID_SECRET} `;

    expect(loadJwtConfig({ BIOEMS_JWT_SECRET: secret })).toEqual({
      secret,
      expireMinutes: 30,
      issuer: "bio-ems",
      audience: "bio-ems-api",
    });
  });

  it("accepts approved expiry, issuer, and audience overrides", () => {
    expect(
      loadJwtConfig({
        BIOEMS_JWT_SECRET: VALID_SECRET,
        BIOEMS_JWT_EXPIRE_MINUTES: "45",
        BIOEMS_JWT_ISSUER: "installation",
        BIOEMS_JWT_AUDIENCE: "installation-api",
      })
    ).toMatchObject({ expireMinutes: 45, issuer: "installation", audience: "installation-api" });
  });

  it.each([undefined, "", "short"])("rejects a missing or short secret", (secret) => {
    expect(() => loadJwtConfig({ BIOEMS_JWT_SECRET: secret })).toThrow(JwtConfigurationError);
  });

  it("does not use the legacy JWT_SECRET variable as fallback", () => {
    expect(() => loadJwtConfig({ JWT_SECRET: VALID_SECRET })).toThrow(JwtConfigurationError);
  });

  it("measures secret length in UTF-8 bytes", () => {
    expect(loadJwtConfig({ BIOEMS_JWT_SECRET: "é".repeat(16) }).secret).toBe("é".repeat(16));
    expect(() => loadJwtConfig({ BIOEMS_JWT_SECRET: "é".repeat(15) })).toThrow(
      JwtConfigurationError
    );
  });

  it.each(["", "0", "-1", "1.5", "NaN"])("rejects invalid expiry: %s", (value) => {
    expect(() =>
      loadJwtConfig({ BIOEMS_JWT_SECRET: VALID_SECRET, BIOEMS_JWT_EXPIRE_MINUTES: value })
    ).toThrow(JwtConfigurationError);
  });

  it("does not log or expose secret values in configuration errors", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const secret = "sensitive-short-secret";

    expect(() => loadJwtConfig({ BIOEMS_JWT_SECRET: secret })).toThrowError(
      "Invalid JWT configuration"
    );
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});
