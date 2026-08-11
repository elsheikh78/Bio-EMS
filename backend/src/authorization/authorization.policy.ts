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
  ]),
  OPERATOR: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "DEVICE_MANAGE",
    "ALARM_READ",
    "ALARM_ACKNOWLEDGE",
    "DASHBOARD_READ",
  ]),
  VIEWER: new Set<Permission>([
    "CONFIGURATION_READ",
    "DEVICE_READ",
    "ALARM_READ",
    "DASHBOARD_READ",
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
