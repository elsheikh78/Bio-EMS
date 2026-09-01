import type { UserRole } from "../auth/contracts";

export const permissions = [
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
  "COMMISSIONING_READ",
  "COMMISSIONING_MANAGE",
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions = {
  ADMIN: new Set<Permission>(permissions),
  OPERATOR: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "DEVICE_MANAGE",
    "ALARM_READ",
    "ALARM_ACKNOWLEDGE",
    "DASHBOARD_READ",
    "REPORT_READ",
    "REPORT_EXPORT",
    "COMMISSIONING_READ",
    "COMMISSIONING_MANAGE",
  ]),
  VIEWER: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "ALARM_READ",
    "DASHBOARD_READ",
    "REPORT_READ",
    "COMMISSIONING_READ",
  ]),
} satisfies Readonly<Record<UserRole, ReadonlySet<Permission>>>;

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}
