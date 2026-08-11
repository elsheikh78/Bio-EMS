import { describe, expect, it } from "vitest";
import { UserRole } from "../../entities/User";
import { hasPermission } from "../authorization.policy";
import { Permission, PERMISSIONS } from "../permissions";

const EXPECTED_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  ADMIN: PERMISSIONS,
  OPERATOR: [
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "DEVICE_MANAGE",
    "ALARM_READ",
    "ALARM_ACKNOWLEDGE",
    "DASHBOARD_READ",
  ],
  VIEWER: ["CONFIGURATION_READ", "DEVICE_READ", "ALARM_READ", "DASHBOARD_READ"],
};

describe("central authorization policy", () => {
  it.each(Object.entries(EXPECTED_PERMISSIONS) as Array<[UserRole, readonly Permission[]]>)(
    "implements the complete %s permission matrix",
    (role, allowedPermissions) => {
      for (const permission of PERMISSIONS) {
        expect(hasPermission(role, permission)).toBe(allowedPermissions.includes(permission));
      }
    }
  );

  it("denies an unknown role defensively", () => {
    expect(hasPermission("OWNER", "CONFIGURATION_READ")).toBe(false);
    expect(hasPermission(undefined, "DEVICE_READ")).toBe(false);
  });
});
