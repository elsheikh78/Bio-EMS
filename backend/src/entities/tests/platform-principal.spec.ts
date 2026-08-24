import { describe, expect, it } from "vitest";
import { hasPermission } from "../../authorization/authorization.policy";
import { createUserSchema, updateUserSchema } from "../../modules/user/dto/user.schema";
import { isPlatformPrincipal, PLATFORM_PRINCIPAL_TYPES } from "../PlatformPrincipal";
import { USER_ROLES } from "../User";

describe("SYSTEM_OWNER platform boundary", () => {
  it("keeps SYSTEM_OWNER outside customer user roles", () => {
    expect(PLATFORM_PRINCIPAL_TYPES).toEqual(["SYSTEM_OWNER"]);
    expect(USER_ROLES).toEqual(["ADMIN", "OPERATOR", "VIEWER"]);
    expect(USER_ROLES).not.toContain("SYSTEM_OWNER");
  });

  it("rejects SYSTEM_OWNER in customer user creation", () => {
    const result = createUserSchema.safeParse({
      username: "owner",
      email: null,
      password: "valid-password",
      role: "SYSTEM_OWNER",
    });

    expect(result.success).toBe(false);
  });

  it("rejects SYSTEM_OWNER in customer role updates", () => {
    const result = updateUserSchema.safeParse({ role: "SYSTEM_OWNER" });

    expect(result.success).toBe(false);
  });

  it("does not grant customer-role permissions to SYSTEM_OWNER implicitly", () => {
    expect(hasPermission("SYSTEM_OWNER", "USER_MANAGE")).toBe(false);
    expect(hasPermission("SYSTEM_OWNER", "CONFIGURATION_WRITE")).toBe(false);
  });

  it("recognizes only the explicit SYSTEM_OWNER platform principal shape", () => {
    expect(
      isPlatformPrincipal({
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      })
    ).toBe(true);

    expect(
      isPlatformPrincipal({
        kind: "customer",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      })
    ).toBe(false);

    expect(
      isPlatformPrincipal({
        kind: "platform",
        type: "ADMIN",
        id: "1",
        username: "admin",
      })
    ).toBe(false);
  });
});
