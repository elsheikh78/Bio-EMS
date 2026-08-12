import type { UserRole } from "../auth/contracts";
import { hasPermission, type Permission } from "../authorization/permissions";

export const routePolicies = {
  "/": "DASHBOARD_READ",
  "/dashboard": "DASHBOARD_READ",
  "/monitored-areas": "CONFIGURATION_READ",
  "/alarms": "ALARM_READ",
  "/devices": "DEVICE_READ",
  "/configuration": "CONFIGURATION_READ",
  "/users": "USER_MANAGE",
} as const satisfies Readonly<Record<string, Permission>>;

export type AuthorizedRoutePath = keyof typeof routePolicies;

export interface LoginLocationState {
  returnTo?: unknown;
}

export function resolveSafeReturnPath(state: unknown, role: UserRole) {
  if (!isLoginLocationState(state) || typeof state.returnTo !== "string") {
    return "/";
  }

  const target = state.returnTo;
  if (target === "/foundation") return "/";
  if (!isAuthorizedRoutePath(target)) return "/";
  return hasPermission(role, routePolicies[target]) ? target : "/";
}

export function isAuthorizedRoutePath(
  path: string,
): path is AuthorizedRoutePath {
  return Object.hasOwn(routePolicies, path);
}

function isLoginLocationState(value: unknown): value is LoginLocationState {
  return typeof value === "object" && value !== null;
}
