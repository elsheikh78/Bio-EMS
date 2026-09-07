import { describe, expect, it } from "vitest";
import type { Device } from "./contracts";
import { summarizeDevices } from "./presentation";

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
});
