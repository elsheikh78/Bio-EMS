import type { Device } from "./contracts";

export type DeviceCommunicationStatus =
  "ONLINE" | "STALE" | "OFFLINE" | "NEVER_SEEN" | "NOT_OPERATIONAL";

export const DEVICE_HEALTH_POLICY = {
  staleAfterSeconds: 120,
  offlineAfterSeconds: 300,
} as const;

export function summarizeDevices(devices: Device[]) {
  return {
    total: devices.length,
    active: devices.filter((device) => device.status === "active").length,
    pending: devices.filter((device) => device.status === "pending").length,
    disabled: devices.filter((device) => device.status === "disabled").length,
  };
}

export function deriveDeviceCommunicationStatus(
  device: Device,
  now: Date = new Date(),
): DeviceCommunicationStatus {
  if (device.status !== "active" || device.activated !== 1) {
    return "NOT_OPERATIONAL";
  }
  if (!device.last_seen_at) return "NEVER_SEEN";

  const ageSeconds = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(device.last_seen_at)) / 1000),
  );
  if (ageSeconds <= DEVICE_HEALTH_POLICY.staleAfterSeconds) return "ONLINE";
  if (ageSeconds <= DEVICE_HEALTH_POLICY.offlineAfterSeconds) return "STALE";
  return "OFFLINE";
}

export function summarizeDeviceCommunication(
  devices: Device[],
  now: Date = new Date(),
) {
  const summary: Record<DeviceCommunicationStatus, number> = {
    ONLINE: 0,
    STALE: 0,
    OFFLINE: 0,
    NEVER_SEEN: 0,
    NOT_OPERATIONAL: 0,
  };

  devices.forEach((device) => {
    summary[deriveDeviceCommunicationStatus(device, now)] += 1;
  });
  return summary;
}
