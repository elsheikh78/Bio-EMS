import { describe, expect, it } from "vitest";
import {
  backendErrorEnvelopeSchema,
  currentUserResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  userRoleSchema,
} from "./contracts";

describe("authentication external contracts", () => {
  it("accepts only the exact Backend roles", () => {
    expect(userRoleSchema.options).toEqual(["ADMIN", "OPERATOR", "VIEWER"]);
    expect(userRoleSchema.safeParse("OWNER").success).toBe(false);
  });

  it("normalizes the username without modifying the password", () => {
    expect(
      loginRequestSchema.parse({ username: " admin ", password: " password " }),
    ).toEqual({ username: "admin", password: " password " });
  });

  it("validates the exact Login success contract and dynamic lifetime", () => {
    const result = loginResponseSchema.parse({
      access_token: "opaque-token",
      token_type: "bearer",
      expires_in: 37,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });

    expect(result.expires_in).toBe(37);
    expect(
      loginResponseSchema.safeParse({ ...result, expires_in: 0 }).success,
    ).toBe(false);
    expect(
      loginResponseSchema.safeParse({ ...result, unexpected: true }).success,
    ).toBe(false);
  });

  it("validates the exact current-principal and error envelopes", () => {
    expect(
      currentUserResponseSchema.parse({
        user: { id: 2, username: "operator", role: "OPERATOR" },
      }),
    ).toEqual({ user: { id: 2, username: "operator", role: "OPERATOR" } });
    expect(
      currentUserResponseSchema.safeParse({
        user: {
          id: 2,
          username: "operator",
          role: "OPERATOR",
          status: "active",
        },
      }).success,
    ).toBe(false);
    expect(
      backendErrorEnvelopeSchema.parse({
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required",
        },
      }).error.code,
    ).toBe("AUTHENTICATION_REQUIRED");
  });
});
