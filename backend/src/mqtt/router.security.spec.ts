import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../modules/telemetry/listeners/telemetry.listener", () => ({
  handleTelemetry: vi.fn(),
}));

import { handleTelemetry } from "../modules/telemetry/listeners/telemetry.listener";
import { routeMessage } from "./router";

describe("MQTT router security boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves the established telemetry topic and payload contract", async () => {
    const payload = Buffer.from('{"temperature":21.5}');

    await routeMessage("bioems/site-1/telemetry/device-1", payload);

    expect(handleTelemetry).toHaveBeenCalledOnce();
    expect(handleTelemetry).toHaveBeenCalledWith("bioems/site-1/telemetry/device-1", payload);
  });

  it("rejects invalid topics without logging attacker-controlled topic segments", async () => {
    const sensitiveMarker = "authorization-bearer-sensitive-marker";
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await routeMessage(`bioems/${sensitiveMarker}`, Buffer.from("{}"));
    await routeMessage(`bioems/site-1/${sensitiveMarker}/device-1`, Buffer.from("{}"));

    expect(handleTelemetry).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledTimes(2);
    expect(warning.mock.calls.flat().join(" ")).not.toContain(sensitiveMarker);
  });
});
