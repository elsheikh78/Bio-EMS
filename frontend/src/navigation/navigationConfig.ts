import type { TranslationResources } from "../localization/resources";
import type { Permission } from "../authorization/permissions";

export type NavigationLabelKey = keyof TranslationResources["navigation"];

export interface NavigationItemDefinition {
  id: string;
  path: string;
  labelKey: NavigationLabelKey;
  permission: Permission;
}

export const navigationItems = [
  {
    id: "workspace",
    path: "/",
    labelKey: "workspace",
    permission: "DASHBOARD_READ",
  },
  {
    id: "dashboard",
    path: "/dashboard",
    labelKey: "dashboard",
    permission: "DASHBOARD_READ",
  },
  {
    id: "monitored-areas",
    path: "/monitored-areas",
    labelKey: "monitoredAreas",
    permission: "CONFIGURATION_READ",
  },
  {
    id: "alarms",
    path: "/alarms",
    labelKey: "alarms",
    permission: "ALARM_READ",
  },
  {
    id: "devices",
    path: "/devices",
    labelKey: "devices",
    permission: "DEVICE_READ",
  },
  {
    id: "configuration",
    path: "/configuration",
    labelKey: "configuration",
    permission: "CONFIGURATION_READ",
  },
  { id: "users", path: "/users", labelKey: "users", permission: "USER_MANAGE" },
] as const satisfies readonly NavigationItemDefinition[];
