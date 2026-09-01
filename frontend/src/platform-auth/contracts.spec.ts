import { describe, expect, it } from "vitest";
import {
  platformLoginResponseSchema,
  platformPrincipalSchema,
} from "./contracts";

const owner = {
  kind: "platform",
  type: "SYSTEM_OWNER",
  id: "owner-1",
  username: "system-owner",
} as const;

describe("SYSTEM_OWNER frontend contracts", () => {
  it("accepts the isolated platform principal", () => {
    expect(platformPrincipalSchema.parse(owner)).toEqual(owner);
  });

  it("rejects customer roles from the platform trust domain", () => {
    expect(() =>
      platformPrincipalSchema.parse({
        kind: "customer",
        type: "ADMIN",
        id: 1,
        username: "admin",
      }),
    ).toThrow();
  });

  it("requires SYSTEM_OWNER in login responses", () => {
    expect(() =>
      platformLoginResponseSchema.parse({
        access_token: "token",
        token_type: "bearer",
        expires_in: 900,
        principal: { ...owner, type: "ADMIN" },
      }),
    ).toThrow();
  });
});
