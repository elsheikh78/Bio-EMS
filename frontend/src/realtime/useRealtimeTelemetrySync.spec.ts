import { describe, expect, it } from "vitest";
import { parseSseDataBlock } from "./useRealtimeTelemetrySync";

describe("realtime telemetry SSE parser", () => {
  it("accepts the controlled telemetry event", () => {
    expect(
      parseSseDataBlock(
        'id: 1\nevent: telemetry.accepted\ndata: {"eventId":"1","type":"telemetry.accepted","acceptedAt":"2026-08-31T00:00:00.000Z","siteCode":"SITE-1","deviceId":"DEV-1","sensorCodes":["TEMP-1"]}',
      ),
    ).toEqual({
      eventId: "1",
      type: "telemetry.accepted",
      acceptedAt: "2026-08-31T00:00:00.000Z",
      siteCode: "SITE-1",
      deviceId: "DEV-1",
      sensorCodes: ["TEMP-1"],
    });
  });

  it("ignores heartbeats and malformed events", () => {
    expect(parseSseDataBlock(": heartbeat")).toBeUndefined();
    expect(parseSseDataBlock("data: not-json")).toBeUndefined();
  });
});
