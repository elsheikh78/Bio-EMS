import type { TranslationResources } from "../localization/resources";
import type { Permission } from "../authorization/permissions";

export type NavigationLabelKey = keyof TranslationResources["navigation"];

export interface NavigationItemDefinition {
  group: "overview" | "administration";
  id: string;
  path: string;
  labelKey: NavigationLabelKey;
  permission: Permission;
}

export const navigationItems = [
  {
    group: "overview",
    id: "workspace",
    path: "/",
    labelKey: "workspace",
    permission: "DASHBOARD_READ",
  },
  {
    group: "overview",
    id: "dashboard",
    path: "/dashboard",
    labelKey: "dashboard",
    permission: "DASHBOARD_READ",
  },
  {
    group: "overview",
    id: "monitored-areas",
    path: "/monitored-areas",
    labelKey: "monitoredAreas",
    permission: "CONFIGURATION_READ",
  },
  {
    group: "overview",
    id: "alarms",
    path: "/alarms",
    labelKey: "alarms",
    permission: "ALARM_READ",
  },
  {
    group: "overview",
    id: "devices",
    path: "/devices",
    labelKey: "devices",
    permission: "DEVICE_READ",
  },
  {
    group: "overview",
    id: "notification-deliveries",
    path: "/notification-deliveries",
    labelKey: "notificationDeliveries",
    permission: "ALARM_READ",
  },
  {
    group: "overview",
    id: "sensors-calibration",
    path: "/sensors-calibration",
    labelKey: "sensorsCalibration",
    permission: "CONFIGURATION_READ",
  },
  {
    group: "overview",
    id: "reports",
    path: "/reports",
    labelKey: "reports",
    permission: "REPORT_READ",
  },
  {
    group: "administration",
    id: "configuration",
    path: "/configuration",
    labelKey: "configuration",
    permission: "CONFIGURATION_WRITE",
  },
  {
    group: "administration",
    id: "users",
    path: "/users",
    labelKey: "users",
    permission: "USER_MANAGE",
  },
] as const satisfies readonly NavigationItemDefinition[];
