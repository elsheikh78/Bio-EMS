import { describe, expect, it } from "vitest";
import { dashboardQueryKeys } from "./queries";

describe("dashboard query keys", () => {
  it("keeps every dashboard query under one cache namespace", () => {
    expect(dashboardQueryKeys.summary()).toEqual(["dashboard", "summary"]);

    expect(dashboardQueryKeys.latestTelemetry()).toEqual([
      "dashboard",
      "latest-telemetry",
    ]);

    expect(dashboardQueryKeys.roomStatuses()).toEqual([
      "dashboard",
      "room-statuses",
    ]);

    expect(dashboardQueryKeys.alarmStatistics()).toEqual([
      "dashboard",
      "alarm-statistics",
    ]);
  });

  it("uses distinct keys for independent dashboard resources", () => {
    const keys = [
      dashboardQueryKeys.summary(),
      dashboardQueryKeys.latestTelemetry(),
      dashboardQueryKeys.roomStatuses(),
      dashboardQueryKeys.alarmStatistics(),
    ].map((key) => JSON.stringify(key));

    expect(new Set(keys).size).toBe(4);
  });
});
