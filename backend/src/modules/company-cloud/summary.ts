import type Database from "better-sqlite3";
export function operationalSummary(database: Database.Database, now = Date.now()) {
  // Count aggregates only; no credentials, contacts or historical readings leave the client.
  const sensor = database.prepare("SELECT count(*) AS n FROM sensors WHERE enabled=1").get() as {
    n: number;
  };
  const device = database.prepare("SELECT count(*) AS n FROM devices").get() as { n: number };
  const offline = database
    .prepare(
      "SELECT count(*) AS n FROM devices WHERE status='active' AND activated=1 AND (last_seen_at IS NULL OR CAST(strftime('%s',last_seen_at) AS INTEGER) < ?)"
    )
    .get(Math.floor(now / 1000) - 300) as { n: number };
  const alarms = database
    .prepare(
      "SELECT count(*) AS active, COALESCE(sum(CASE WHEN status='TRIGGERED' THEN 1 ELSE 0 END),0) AS unacknowledged FROM alarms WHERE status!='RECOVERED'"
    )
    .get() as { active: number; unacknowledged: number };
  return {
    sensorCount: sensor.n,
    deviceCount: device.n,
    offlineDevices: offline.n,
    activeAlarms: alarms.active,
    unacknowledgedAlarms: alarms.unacknowledged,
  };
}
