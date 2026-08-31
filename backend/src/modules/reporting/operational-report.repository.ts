import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";

export type OperationalReportType = "ALARM-HISTORY" | "DEVICE-HEALTH" | "AUDIT-OPERATIONS";

export class OperationalReportRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  list(type: OperationalReportType, sensorUuids: string[], from: string, to: string) {
    const placeholders = sensorUuids.map(() => "?").join(",");
    if (type === "ALARM-HISTORY") {
      return this.database
        .prepare(
          `SELECT a.id, s.uuid AS sensor_uuid, s.code AS sensor_code,
        a.type, a.severity, a.status, a.trigger_value, a.trigger_time,
        a.acknowledged_time, u.username AS acknowledged_by, a.recovered_time,
        r.code AS room_code, st.code AS site_code
        FROM alarms a JOIN sensors s ON s.id=a.sensor_id
        JOIN rooms r ON r.id=s.room_id JOIN sites st ON st.id=r.site_id
        LEFT JOIN users u ON u.id=a.acknowledged_by_user_id
        WHERE s.uuid IN (${placeholders}) AND a.trigger_time >= ? AND a.trigger_time < ?
        ORDER BY a.trigger_time DESC, a.id DESC`
        )
        .all(...sensorUuids, from, to);
    }
    if (type === "DEVICE-HEALTH") {
      return this.database
        .prepare(
          `SELECT e.id, d.uuid AS device_uuid, d.device_id,
        e.event_type, e.observed_at, st.code AS site_code
        FROM device_communication_events e JOIN devices d ON d.id=e.device_id
        JOIN sites st ON st.id=d.site_id
        WHERE d.id IN (SELECT DISTINCT device_id FROM sensors WHERE uuid IN (${placeholders}))
        AND e.observed_at >= ? AND e.observed_at < ?
        ORDER BY e.observed_at DESC, e.id DESC`
        )
        .all(...sensorUuids, from, to);
    }
    return this.database
      .prepare(
        `SELECT ae.id, ae.occurred_at, ae.actor_kind,
      ae.actor_username, ae.actor_role, ae.action, ae.target_type, ae.target_id,
      ae.result, ae.reason, ae.source_context, st.code AS site_code
      FROM audit_events ae LEFT JOIN sites st ON st.id=ae.site_id
      WHERE ae.site_id IN (SELECT DISTINCT r.site_id FROM sensors s
        JOIN rooms r ON r.id=s.room_id WHERE s.uuid IN (${placeholders}))
      AND ae.occurred_at >= ? AND ae.occurred_at < ?
      ORDER BY ae.occurred_at DESC, ae.id DESC`
      )
      .all(...sensorUuids, from, to);
  }
}
