import { beforeEach, describe, expect, it, vi } from "vitest";

const { processTelemetry } = vi.hoisted(() => ({
  processTelemetry: vi.fn(),
}));

vi.mock("../services/telemetry.service", () => ({
  TelemetryService: vi.fn().mockImplementation(() => ({ process: processTelemetry })),
}));

import { handleTelemetry } from "./telemetry.listener";

describe("Telemetry listener security boundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    processTelemetry.mockReset();
  });

  it("passes a valid payload through the production parser unchanged", async () => {
    const topic = "bioems/CAIRO01/telemetry/ZC-FW-001";
    const payload = {
      protocolVersion: "1.0",
      timestamp: "2026-08-11T08:00:00.000Z",
      battery: 90,
      signal: -55,
      sensors: [{ channel: 1, value: 7.5 }],
    };

    await handleTelemetry(topic, Buffer.from(JSON.stringify(payload)));

    expect(processTelemetry).toHaveBeenCalledOnce();
    expect(processTelemetry).toHaveBeenCalledWith(topic, payload);
  });

  it("rejects malformed payloads without logging their sensitive contents", async () => {
    const sensitiveMarker = "authorization-bearer-sensitive-marker";
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await handleTelemetry("bioems/CAIRO01/telemetry/ZC-FW-001", Buffer.from(sensitiveMarker));

    expect(processTelemetry).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls.flat().join(" ")).not.toContain(sensitiveMarker);
  });
});
