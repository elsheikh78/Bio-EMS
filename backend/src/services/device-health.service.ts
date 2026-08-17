import type { DeviceCommunicationStatus } from "../domain/enums/device-communication-status";
import { AppError } from "../errors/app-error";
import type { Device } from "../repositories/device.repository";
import { DeviceRepository } from "../repositories/device.repository";

export const DEVICE_HEALTH_POLICY = {
  staleAfterSeconds: 120,
  offlineAfterSeconds: 300,
} as const;

export interface DeviceHealth {
  device_id: string;
  lifecycle_status: string;
  communication_status: DeviceCommunicationStatus;
  last_seen_at: string | null;
  last_heartbeat_at: string | null;
  seconds_since_seen: number | null;
  stale_after_seconds: number;
  offline_after_seconds: number;
}

const repository = new DeviceRepository();

export function deriveCommunicationStatus(
  device: Device,
  now: Date = new Date()
): DeviceCommunicationStatus {
  if (device.status !== "active" || device.activated !== 1) return "NOT_OPERATIONAL";
  if (!device.last_seen_at) return "NEVER_SEEN";

  const ageSeconds = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(device.last_seen_at)) / 1000)
  );
  if (ageSeconds <= DEVICE_HEALTH_POLICY.staleAfterSeconds) return "ONLINE";
  if (ageSeconds <= DEVICE_HEALTH_POLICY.offlineAfterSeconds) return "STALE";
  return "OFFLINE";
}

export function getDeviceHealth(deviceId: string, now: Date = new Date()): DeviceHealth {
  const device = repository.findByDeviceId(deviceId);
  if (!device) throw new AppError("Device not found", 404, "DEVICE_NOT_FOUND");

  return toDeviceHealth(device, now);
}

export function toDeviceHealth(device: Device, now: Date = new Date()): DeviceHealth {
  const secondsSinceSeen = device.last_seen_at
    ? Math.max(0, Math.floor((now.getTime() - Date.parse(device.last_seen_at)) / 1000))
    : null;

  return {
    device_id: device.device_id,
    lifecycle_status: device.status ?? "unknown",
    communication_status: deriveCommunicationStatus(device, now),
    last_seen_at: device.last_seen_at ?? null,
    last_heartbeat_at: device.last_heartbeat_at ?? null,
    seconds_since_seen: secondsSinceSeen,
    stale_after_seconds: DEVICE_HEALTH_POLICY.staleAfterSeconds,
    offline_after_seconds: DEVICE_HEALTH_POLICY.offlineAfterSeconds,
  };
}
