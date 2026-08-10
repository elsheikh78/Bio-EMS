import { describe, expect, it } from "vitest";
import { MQTT_TOPICS } from "../../mqtt/topics";
import { telemetrySchema } from "./schemas/telemetry.schema";

describe("Telemetry contracts", () => {
  it("preserves the approved telemetry subscription pattern and topic ordering", () => {
    expect(MQTT_TOPICS.TELEMETRY).toBe("bioems/+/telemetry/+");

    const [root, siteCode, messageType, deviceId] = "bioems/CAIRO01/telemetry/ZC-FW-001".split("/");

    expect({ root, siteCode, messageType, deviceId }).toEqual({
      root: "bioems",
      siteCode: "CAIRO01",
      messageType: "telemetry",
      deviceId: "ZC-FW-001",
    });
  });

  it("preserves the current telemetry payload contract", () => {
    const valid = {
      protocolVersion: "1.0",
      timestamp: "2026-08-10T08:00:00.000Z",
      battery: 90,
      signal: -55,
      sensors: [{ channel: 1, value: 7.5 }],
    };

    expect(telemetrySchema.parse(valid)).toEqual(valid);
    expect(() => telemetrySchema.parse({ ...valid, sensors: [] })).toThrow();
    expect(() =>
      telemetrySchema.parse({ ...valid, sensors: [{ channel: "1", value: 7.5 }] })
    ).toThrow();
  });
});
