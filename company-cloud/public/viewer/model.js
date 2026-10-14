export const isActive = (a) => a.status !== "RECOVERED";
export const alarmLevel = (a) =>
  /critical|high|alarm/i.test(a.severity) ? "critical" : "warning";
export function roomState(site, room, now, limits, connected = true) {
  const snapshot = site.snapshot;
  const sensors = snapshot.sensors.filter((s) => s.roomId === room.id);
  const alarms = snapshot.alarms.filter(
    (a) => a.roomId === room.id && isActive(a),
  );
  const staleSite =
    !connected ||
    !site.receivedAt ||
    now - site.receivedAt > limits.snapshotFreshMs ||
    now - Date.parse(snapshot.capturedAt) > limits.snapshotFreshMs ||
    !snapshot.telemetryAvailable;
  const staleReading = (s) =>
    staleSite ||
    s.value === null ||
    !s.recordedAt ||
    now - Date.parse(s.recordedAt) > limits.readingFreshMs;
  // Active alarms stay visible even when data is stale. Freshness is a separate label.
  const level = alarms.some((a) => alarmLevel(a) === "critical")
    ? "critical"
    : alarms.length
      ? "warning"
      : staleSite || !sensors.length || sensors.some(staleReading)
        ? "offline"
        : "normal";
  return {
    sensors,
    alarms,
    level,
    staleSite,
    staleReading,
    stale: staleSite || !sensors.length || sensors.some(staleReading),
  };
}
export function newAlarmKeys(sites, known) {
  return sites
    .flatMap((site) =>
      (site.snapshot?.alarms || [])
        .filter(isActive)
        .map((a) => `${site.id}:${a.id}`),
    )
    .filter((id) => !known.has(id));
}
