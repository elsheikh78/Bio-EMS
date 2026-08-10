export const PERMISSIONS = [
  "CONFIGURATION_READ",
  "CONFIGURATION_WRITE",
  "DEVICE_READ",
  "DEVICE_MANAGE",
  "ALARM_READ",
  "ALARM_ACKNOWLEDGE",
  "DASHBOARD_READ",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
