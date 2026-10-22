export type Language = "ar" | "en";
export interface Sensor {
  id: string;
  roomId: string;
  name: string;
  code: string;
  type: string;
  unit: string;
  value: number | null;
  recordedAt: string | null;
}
export interface Room {
  id: string;
  name: string;
  code: string;
}
export interface Alarm {
  id: string;
  roomId: string;
  sensorId: string;
  type: string;
  severity: string;
  status: "TRIGGERED" | "ACKNOWLEDGED" | "RECOVERED";
  value: number | null;
  triggeredAt: string;
  recoveredAt: string | null;
}
export interface Site {
  id: string;
  name: string;
  receivedAt: number | null;
  snapshot: {
    capturedAt: string;
    telemetryAvailable: boolean;
    rooms: Room[];
    sensors: Sensor[];
    alarms: Alarm[];
  } | null;
}
export interface Overview {
  role: "VIEWER";
  name: string;
  customerName: string;
  serverTime: number;
  snapshotFreshMs: number;
  readingFreshMs: number;
  sites: Site[];
}
export const isActive = (a: Alarm) => a.status !== "RECOVERED";
export const alarmLevel = (a: Alarm) =>
  /critical|high|alarm/i.test(a.severity) ? "critical" : "warning";
export function roomState(
  site: Site,
  room: Room,
  now: number,
  limits: Overview,
  connected: boolean,
) {
  const s = site.snapshot;
  const sensors = s?.sensors.filter((x) => x.roomId === room.id) || [];
  const alarms =
    s?.alarms.filter((x) => x.roomId === room.id && isActive(x)) || [];
  const staleSite =
    !connected ||
    !s ||
    !site.receivedAt ||
    now - site.receivedAt > limits.snapshotFreshMs ||
    !Number.isFinite(Date.parse(s.capturedAt)) ||
    now - Date.parse(s.capturedAt) > limits.snapshotFreshMs ||
    !s.telemetryAvailable;
  const staleReading = (sensor: Sensor) =>
    staleSite ||
    sensor.value === null ||
    !sensor.recordedAt ||
    !Number.isFinite(Date.parse(sensor.recordedAt)) ||
    now - Date.parse(sensor.recordedAt) > limits.readingFreshMs;
  const stale = staleSite || !sensors.length || sensors.some(staleReading);
  const level: "critical" | "warning" | "offline" | "normal" = alarms.some(
    (a) => alarmLevel(a) === "critical",
  )
    ? "critical"
    : alarms.length
      ? "warning"
      : stale
        ? "offline"
        : "normal";
  return { sensors, alarms, stale, level, staleReading };
}
export function activeAlarmKeys(sites: Site[]) {
  return sites.flatMap((s) =>
    (s.snapshot?.alarms || []).filter(isActive).map((a) => `${s.id}:${a.id}`),
  );
}
export function safeOverview(value: unknown): Overview {
  // Fail closed on malformed responses; never turn missing telemetry into healthy zeros.
  const d = value as Overview;
  if (
    !d ||
    d.role !== "VIEWER" ||
    typeof d.name !== "string" ||
    typeof d.customerName !== "string" ||
    !Number.isFinite(d.serverTime) ||
    !(d.snapshotFreshMs > 0) ||
    !(d.readingFreshMs > 0) ||
    !Array.isArray(d.sites)
  )
    throw Error("Invalid overview");
  for (const site of d.sites) {
    if (typeof site.id !== "string" || typeof site.name !== "string")
      throw Error("Invalid site");
    const s = site.snapshot;
    if (!s) continue;
    if (
      typeof s.capturedAt !== "string" ||
      typeof s.telemetryAvailable !== "boolean" ||
      !Array.isArray(s.rooms) ||
      !Array.isArray(s.sensors) ||
      !Array.isArray(s.alarms)
    )
      throw Error("Invalid snapshot");
    for (const r of s.rooms)
      if (
        typeof r.id !== "string" ||
        typeof r.name !== "string" ||
        typeof r.code !== "string"
      )
        throw Error("Invalid room");
    for (const r of s.sensors)
      if (
        typeof r.id !== "string" ||
        typeof r.roomId !== "string" ||
        typeof r.name !== "string" ||
        typeof r.code !== "string" ||
        typeof r.type !== "string" ||
        typeof r.unit !== "string" ||
        (r.value !== null && !Number.isFinite(r.value)) ||
        (r.recordedAt !== null && typeof r.recordedAt !== "string")
      )
        throw Error("Invalid sensor");
    for (const a of s.alarms)
      if (
        typeof a.id !== "string" ||
        typeof a.roomId !== "string" ||
        typeof a.sensorId !== "string" ||
        typeof a.type !== "string" ||
        typeof a.severity !== "string" ||
        typeof a.triggeredAt !== "string" ||
        !["TRIGGERED", "ACKNOWLEDGED", "RECOVERED"].includes(a.status)
      )
        throw Error("Invalid alarm");
  }
  return d;
}
