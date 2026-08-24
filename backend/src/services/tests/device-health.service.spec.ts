import { describe, expect, it } from "vitest";
import type { Device } from "../../repositories/device.repository";
import {
  deriveCommunicationStatus,
  summarizeDeviceCommunicationStatuses,
  toDeviceHealth,
} from "../device-health.service";

const now = new Date("2026-08-17T10:00:00.000Z");
const device = {
  device_id: "ZC-FW-001",
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  site_id: 1,
  device_type: "zone-controller",
  protocol: "mqtt",
  status: "active",
  activated: 1,
} satisfies Device;

describe("Device communication health", () => {
  it.each([
    ["pending lifecycle", { ...device, status: "pending", activated: 0 }, "NOT_OPERATIONAL"],
    ["never seen", device, "NEVER_SEEN"],
    ["online boundary", { ...device, last_seen_at: "2026-08-17T09:58:00.000Z" }, "ONLINE"],
    ["stale", { ...device, last_seen_at: "2026-08-17T09:57:00.000Z" }, "STALE"],
    ["offline", { ...device, last_seen_at: "2026-08-17T09:54:59.000Z" }, "OFFLINE"],
  ])("derives %s", (_case, input, expected) => {
    expect(deriveCommunicationStatus(input, now)).toBe(expected);
  });

  it("returns explicit policy and independent lifecycle/communication fields", () => {
    expect(
      toDeviceHealth(
        {
          ...device,
          last_seen_at: "2026-08-17T09:59:30.000Z",
          last_heartbeat_at: "2026-08-17T09:59:00.000Z",
        },
        now
      )
    ).toEqual({
      device_id: "ZC-FW-001",
      lifecycle_status: "active",
      communication_status: "ONLINE",
      last_seen_at: "2026-08-17T09:59:30.000Z",
      last_heartbeat_at: "2026-08-17T09:59:00.000Z",
      seconds_since_seen: 30,
      stale_after_seconds: 120,
      offline_after_seconds: 300,
    });
  });

  it("summarizes every authoritative communication state without treating never-seen Devices as Online", () => {
    expect(
      summarizeDeviceCommunicationStatuses(
        [
          { ...device, status: "pending", activated: 0 },
          device,
          { ...device, device_id: "ONLINE", last_seen_at: "2026-08-17T09:59:00.000Z" },
          { ...device, device_id: "STALE", last_seen_at: "2026-08-17T09:57:00.000Z" },
          { ...device, device_id: "OFFLINE", last_seen_at: "2026-08-17T09:54:00.000Z" },
        ],
        now
      )
    ).toEqual({
      NOT_OPERATIONAL: 1,
      NEVER_SEEN: 1,
      ONLINE: 1,
      STALE: 1,
      OFFLINE: 1,
    });
  });
});
