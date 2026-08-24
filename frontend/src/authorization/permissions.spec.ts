import { describe, expect, it } from "vitest";
import type { UserRole } from "../auth/contracts";
import { hasPermission, permissions, rolePermissions } from "./permissions";

describe("frontend presentation permission matrix", () => {
  it("uses the exact Backend permission vocabulary without CONFIG_READ", () => {
    expect(permissions).toEqual([
      "CONFIGURATION_READ",
      "CONFIGURATION_WRITE",
      "DEVICE_READ",
      "DEVICE_MANAGE",
      "ALARM_READ",
      "ALARM_ACKNOWLEDGE",
      "DASHBOARD_READ",
      "USER_MANAGE",
      "REPORT_READ",
      "REPORT_EXPORT",
      "AUDIT_READ",
      "NOTIFICATION_RECIPIENT_READ",
      "NOTIFICATION_RECIPIENT_MANAGE",
      "ESCALATION_POLICY_READ",
      "ESCALATION_POLICY_MANAGE",
    ]);
    expect(permissions).not.toContain("CONFIG_READ");
  });

  it("mirrors the current Backend role matrix exactly", () => {
    expect([...rolePermissions.ADMIN]).toEqual(permissions);
    expect([...rolePermissions.OPERATOR]).toEqual([
      "CONFIGURATION_READ",
      "DEVICE_READ",
      "DEVICE_MANAGE",
      "ALARM_READ",
      "ALARM_ACKNOWLEDGE",
      "DASHBOARD_READ",
      "REPORT_READ",
      "REPORT_EXPORT",
    ]);
    expect([...rolePermissions.VIEWER]).toEqual([
      "CONFIGURATION_READ",
      "DEVICE_READ",
      "ALARM_READ",
      "DASHBOARD_READ",
      "REPORT_READ",
    ]);
  });

  it.each([
    ["ADMIN", "USER_MANAGE", true],
    ["OPERATOR", "USER_MANAGE", false],
    ["VIEWER", "USER_MANAGE", false],
    ["VIEWER", "CONFIGURATION_READ", true],
    ["ADMIN", "REPORT_EXPORT", true],
    ["OPERATOR", "REPORT_EXPORT", true],
    ["VIEWER", "REPORT_READ", true],
    ["VIEWER", "REPORT_EXPORT", false],
    ["ADMIN", "NOTIFICATION_RECIPIENT_MANAGE", true],
    ["OPERATOR", "NOTIFICATION_RECIPIENT_READ", false],
    ["VIEWER", "ESCALATION_POLICY_READ", false],
    ["ADMIN", "AUDIT_READ", true],
  ] as const)("evaluates %s × %s as %s", (role, permission, expected) => {
    expect(hasPermission(role satisfies UserRole, permission)).toBe(expected);
  });
});
