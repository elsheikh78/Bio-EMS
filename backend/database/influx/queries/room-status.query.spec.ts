import { describe, expect, it } from "vitest";
import { buildRoomTelemetryWindowQuery } from "./room-status.query";

describe("room telemetry window query", () => {
  it("uses a bounded 24-hour window and grouped sensor evidence", () => {
    const query = buildRoomTelemetryWindowQuery("telemetry");

    expect(query).toContain('from(bucket: "telemetry")');
    expect(query).toContain("range(start: -24h)");
    expect(query).toContain('group(columns: ["_measurement", "sensor"])');
    expect(query).toContain("aggregateWindow(every: 2h");
    expect(query).toContain('value: "min"');
    expect(query).toContain('value: "max"');
    expect(query).toContain('value: "trend"');
  });

  it("does not interpolate an untrusted bucket name as executable Flux", () => {
    const query = buildRoomTelemetryWindowQuery('telemetry") |> yield()');

    expect(query).not.toContain('from(bucket: "telemetry") |> yield()"');
  });
});
