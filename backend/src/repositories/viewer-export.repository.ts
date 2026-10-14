import { sqlite } from "../../database/sqlite/client";
import type Database from "better-sqlite3";
import type { Alarm } from "./alarm.repository";

const EXPORT_ALARM_LIMIT = 1001;

export class ViewerExportRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  recentAlarms(siteId: number, since: string): Alarm[] {
    return this.database
      .prepare(
        `SELECT a.* FROM alarms a JOIN sensors s ON s.id=a.sensor_id
         JOIN rooms r ON r.id=s.room_id WHERE r.site_id=?
         AND (a.status!='RECOVERED' OR a.trigger_time>=?) ORDER BY CASE WHEN a.status='RECOVERED' THEN 1 ELSE 0 END,a.id DESC LIMIT ?`
      )
      .all(siteId, since, EXPORT_ALARM_LIMIT) as Alarm[];
  }
}
