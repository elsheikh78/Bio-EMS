import { UserRole } from "../entities/User";
import { Permission } from "./permissions";

const ROLE_PERMISSIONS: Readonly<Record<UserRole, ReadonlySet<Permission>>> = {
  ADMIN: new Set<Permission>([
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
  ]),
  OPERATOR: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "DEVICE_MANAGE",
    "ALARM_READ",
    "ALARM_ACKNOWLEDGE",
    "DASHBOARD_READ",
    "REPORT_READ",
    "REPORT_EXPORT",
  ]),
  VIEWER: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "ALARM_READ",
    "DASHBOARD_READ",
    "REPORT_READ",
  ]),
};

export function hasPermission(role: unknown, permission: Permission): boolean {
  switch (role) {
    case "ADMIN":
    case "OPERATOR":
    case "VIEWER":
      return ROLE_PERMISSIONS[role].has(permission);
    default:
      return false;
  }
}
