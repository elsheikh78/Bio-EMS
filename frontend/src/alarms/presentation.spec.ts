import { describe, expect, it } from "vitest";
import type { Alarm } from "./contracts";
import { filterAlarms, summarizeAlarms } from "./presentation";

const alarms = [
  {
    id: 1,
    sensor_id: 1,
    type: "HIGH",
    severity: "CRITICAL",
    status: "TRIGGERED",
    trigger_value: 9,
  },
  {
    id: 2,
    sensor_id: 2,
    type: "LOW",
    severity: "WARNING",
    status: "TRIGGERED",
    trigger_value: 1,
  },
  {
    id: 3,
    sensor_id: 3,
    type: "HIGH",
    severity: "INFO",
    status: "ACKNOWLEDGED",
    trigger_value: 7,
  },
  {
    id: 4,
    sensor_id: 4,
    type: "LOW",
    severity: "INFO",
    status: "RECOVERED",
    trigger_value: 2,
  },
] satisfies Alarm[];

describe("Alarm presentation", () => {
  it("keeps the active operational view limited to triggered alarms", () => {
    expect(filterAlarms(alarms, "ACTIVE").map((alarm) => alarm.id)).toEqual([
      1, 2,
    ]);
    expect(filterAlarms(alarms, "HISTORY")).toEqual(alarms);
  });

  it("summarizes lifecycle evidence without changing alarm semantics", () => {
    expect(summarizeAlarms(alarms)).toEqual({
      active: 2,
      critical: 1,
      acknowledged: 1,
      recovered: 1,
    });
  });
});
