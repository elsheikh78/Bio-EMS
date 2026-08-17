export const DEVICE_COMMUNICATION_STATUSES = [
  "NOT_OPERATIONAL",
  "NEVER_SEEN",
  "ONLINE",
  "STALE",
  "OFFLINE",
] as const;

export type DeviceCommunicationStatus = (typeof DEVICE_COMMUNICATION_STATUSES)[number];
