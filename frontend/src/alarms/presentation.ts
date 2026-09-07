import type { Alarm } from "./contracts";

export type AlarmView = "ACTIVE" | "HISTORY";

export function filterAlarms(alarms: Alarm[], view: AlarmView) {
  return alarms.filter((alarm) =>
    view === "ACTIVE" ? alarm.status === "TRIGGERED" : true,
  );
}

export function summarizeAlarms(alarms: Alarm[]) {
  return {
    active: alarms.filter((alarm) => alarm.status === "TRIGGERED").length,
    critical: alarms.filter(
      (alarm) => alarm.status === "TRIGGERED" && alarm.severity === "CRITICAL",
    ).length,
    acknowledged: alarms.filter((alarm) => alarm.status === "ACKNOWLEDGED")
      .length,
    recovered: alarms.filter((alarm) => alarm.status === "RECOVERED").length,
  };
}
