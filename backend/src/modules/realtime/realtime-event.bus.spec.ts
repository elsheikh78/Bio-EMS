import { describe, expect, it, vi } from "vitest";
import { realtimeEventBus } from "./realtime-event.bus";

describe("realtime event bus", () => {
  it("delivers accepted telemetry and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = realtimeEventBus.subscribe(listener);
    const event = {
      eventId: "device-1:2026-08-31T00:00:00.000Z",
      type: "telemetry.accepted" as const,
      acceptedAt: "2026-08-31T00:00:00.000Z",
      siteCode: "SITE-1",
      deviceId: "device-1",
      sensorCodes: ["TEMP-1"],
    };

    realtimeEventBus.publish(event);
    unsubscribe();
    realtimeEventBus.publish(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);
  });
});
