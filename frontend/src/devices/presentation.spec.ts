import { describe, expect, it } from "vitest";
import type { Device } from "./contracts";
import {
  deriveDeviceCommunicationStatus,
  summarizeDeviceCommunication,
  summarizeDevices,
} from "./presentation";

const device = (device_id: string, status: Device["status"]): Device => ({
  uuid: `${device_id}-0000-4000-8000-000000000000`,
  device_id,
  site_id: 1,
  device_type: "controller",
  protocol: "MQTT",
  status,
  activated: status === "active" ? 1 : 0,
});

describe("Device presentation", () => {
  it("summarizes the controlled lifecycle states", () => {
    expect(
      summarizeDevices([
        device("a", "active"),
        device("b", "active"),
        device("c", "pending"),
        device("d", "disabled"),
      ]),
    ).toEqual({ total: 4, active: 2, pending: 1, disabled: 1 });
  });

  it("reports lifecycle and communication independently", () => {
    const now = new Date("2026-09-09T09:00:00.000Z");
    const online = {
      ...device("online", "active"),
      last_seen_at: "2026-09-09T08:59:00.000Z",
    };
    const stale = {
      ...device("stale", "active"),
      last_seen_at: "2026-09-09T08:57:30.000Z",
    };
    const offline = {
      ...device("offline", "active"),
      last_seen_at: "2026-09-09T08:50:00.000Z",
    };
    const neverSeen = device("never", "active");
    const disabled = device("disabled", "disabled");

    expect(deriveDeviceCommunicationStatus(online, now)).toBe("ONLINE");
    expect(deriveDeviceCommunicationStatus(stale, now)).toBe("STALE");
    expect(deriveDeviceCommunicationStatus(offline, now)).toBe("OFFLINE");
    expect(deriveDeviceCommunicationStatus(neverSeen, now)).toBe("NEVER_SEEN");
    expect(deriveDeviceCommunicationStatus(disabled, now)).toBe(
      "NOT_OPERATIONAL",
    );
    expect(
      summarizeDeviceCommunication(
        [online, stale, offline, neverSeen, disabled],
        now,
      ),
    ).toEqual({
      ONLINE: 1,
      STALE: 1,
      OFFLINE: 1,
      NEVER_SEEN: 1,
      NOT_OPERATIONAL: 1,
    });
  });
});
