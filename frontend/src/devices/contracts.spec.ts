import { describe, expect, it } from "vitest";
import { deviceHealthSchema, deviceSchema } from "./contracts";
describe("Device contracts", () => {
  it("accepts production registry and health shapes", () => {
    expect(
      deviceSchema.parse({
        uuid: "ee0ee6c1-dbe5-488c-a47a-cb2e8fb9a7bf",
        device_id: "ZC-1",
        site_id: 1,
        device_type: "controller",
        protocol: "MQTT",
        manufacturer: null,
        model: null,
        firmware_version: null,
        status: "active",
        activated: 1,
        last_seen_at: null,
        last_heartbeat_at: null,
      }).device_id,
    ).toBe("ZC-1");
    expect(
      deviceHealthSchema.parse({
        device_id: "ZC-1",
        lifecycle_status: "active",
        communication_status: "ONLINE",
        last_seen_at: null,
        last_heartbeat_at: null,
        seconds_since_seen: 0,
        stale_after_seconds: 120,
        offline_after_seconds: 300,
      }).communication_status,
    ).toBe("ONLINE");
  });
});
