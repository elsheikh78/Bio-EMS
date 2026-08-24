import { describe, expect, it } from "vitest";
import {
  loadPlatformJwtConfig,
  PlatformJwtConfigurationError,
} from "./platform-jwt.config";

describe("platform JWT configuration", () => {
  it("keeps platform authentication disabled when no platform JWT settings exist", () => {
    expect(loadPlatformJwtConfig({})).toBeUndefined();
  });

  it("loads an isolated platform trust domain with safe defaults", () => {
    expect(
      loadPlatformJwtConfig({ BIOEMS_PLATFORM_JWT_SECRET: "p".repeat(32) })
    ).toEqual({
      secret: "p".repeat(32),
      expireMinutes: 15,
      issuer: "bio-ems-platform",
      audience: "bio-ems-platform-api",
    });
  });

  it("accepts explicit issuer, audience, and expiry overrides", () => {
    expect(
      loadPlatformJwtConfig({
        BIOEMS_PLATFORM_JWT_SECRET: "p".repeat(32),
        BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES: "10",
        BIOEMS_PLATFORM_JWT_ISSUER: "installation-platform",
        BIOEMS_PLATFORM_JWT_AUDIENCE: "installation-platform-api",
      })
    ).toEqual({
      secret: "p".repeat(32),
      expireMinutes: 10,
      issuer: "installation-platform",
      audience: "installation-platform-api",
    });
  });

  it.each([
    { BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES: "15" },
    { BIOEMS_PLATFORM_JWT_ISSUER: "custom" },
    { BIOEMS_PLATFORM_JWT_AUDIENCE: "custom-api" },
    { BIOEMS_PLATFORM_JWT_SECRET: "short" },
    {
      BIOEMS_PLATFORM_JWT_SECRET: "p".repeat(32),
      BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES: "0",
    },
    {
      BIOEMS_PLATFORM_JWT_SECRET: "p".repeat(32),
      BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES: "abc",
    },
  ])("rejects partial or invalid platform JWT settings", (environment) => {
    expect(() => loadPlatformJwtConfig(environment)).toThrow(PlatformJwtConfigurationError);
  });
});
