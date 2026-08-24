import { describe, expect, it } from "vitest";
import { shouldReplaceRoomSnapshot } from "../../domain/dashboard-room-priority";

describe("Dashboard room priority aggregation", () => {
  it("keeps the most severe Sensor snapshot even when a normal reading is newer", () => {
    expect(
      shouldReplaceRoomSnapshot(
        "CRITICAL",
        "NORMAL",
        "2026-08-24T10:00:00.000Z",
        "2026-08-24T10:01:00.000Z"
      )
    ).toBe(false);
  });

  it("replaces a normal Sensor snapshot with a critical reading from the same room", () => {
    expect(
      shouldReplaceRoomSnapshot(
        "NORMAL",
        "CRITICAL",
        "2026-08-24T10:01:00.000Z",
        "2026-08-24T10:00:00.000Z"
      )
    ).toBe(true);
  });

  it("uses the newest reading when both Sensors have the same severity", () => {
    expect(
      shouldReplaceRoomSnapshot(
        "NORMAL",
        "NORMAL",
        "2026-08-24T10:00:00.000Z",
        "2026-08-24T10:01:00.000Z"
      )
    ).toBe(true);
  });
});
