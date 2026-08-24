import { describe, expect, it, vi } from "vitest";
import { createDevicesApi } from "./api";

const device = {
  uuid: "550e8400-e29b-41d4-a716-446655440001",
  device_id: "ESP32-001",
  site_id: 1,
  device_type: "temperature_gateway",
  protocol: "mqtt",
  manufacturer: "BIO-EMS",
  model: "PVR-07-TEST",
  firmware_version: "1.0.0",
  status: "active",
  activated: 1,
  last_seen_at: null,
  last_heartbeat_at: null,
  updated_at: "2026-08-24 08:55:00",
};

describe("Devices API", () => {
  it("sends Device metadata as JSON and validates the persisted response", async () => {
    const request = vi.fn().mockResolvedValue(device);

    await expect(
      createDevicesApi(request).update("ESP32-001", {
        model: "PVR-07-TEST",
      }),
    ).resolves.toEqual(device);

    expect(request).toHaveBeenCalledWith("/devices/ESP32-001", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: '{"model":"PVR-07-TEST"}',
    });
  });
});
