import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";

export interface Alarm {
  id?: number;

  sensor_id: number;

  type: string;

  severity: string;

  status: string;

  trigger_value: number;

  trigger_time?: string;

  acknowledged_time?: string;

  recovered_time?: string;

  created_at?: string;
}

export class AlarmRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(alarm: Alarm): number {
    const stmt = this.database.prepare(`

            INSERT INTO alarms
            (
                sensor_id,
                type,
                severity,
                status,
                trigger_value
            )

            VALUES (?, ?, ?, ?, ?)

        `);

    const result = stmt.run(
      alarm.sensor_id,
      alarm.type,
      alarm.severity,
      alarm.status,
      alarm.trigger_value
    );

    return Number(result.lastInsertRowid);
  }

  findActiveAlarm(sensorId: number, type: string): Alarm | undefined {
    const stmt = this.database.prepare(`

            SELECT *

            FROM alarms

            WHERE sensor_id = ?

            AND type = ?

            AND status = 'TRIGGERED'

            ORDER BY id DESC

            LIMIT 1

        `);

    return stmt.get(sensorId, type) as Alarm | undefined;
  }

  recoverAlarm(id: number): void {
    const stmt = this.database.prepare(`

            UPDATE alarms

            SET

                status = 'RECOVERED',

                recovered_time = CURRENT_TIMESTAMP

            WHERE id = ?

        `);

    stmt.run(id);
  }

  acknowledgeAlarm(id: number): void {
    const stmt = this.database.prepare(`

            UPDATE alarms

            SET

                status = 'ACKNOWLEDGED',

                acknowledged_time = CURRENT_TIMESTAMP

            WHERE id = ?

              AND status = 'TRIGGERED'

        `);

    stmt.run(id);
  }

  getById(id: number): Alarm | undefined {
    const stmt = this.database.prepare(`

            SELECT *

            FROM alarms

            WHERE id = ?

            LIMIT 1

        `);

    return stmt.get(id) as Alarm | undefined;
  }

  getActive(): Alarm[] {
    const stmt = this.database.prepare(`

            SELECT *

            FROM alarms

            WHERE status = 'TRIGGERED'

            ORDER BY id DESC

        `);

    return stmt.all() as Alarm[];
  }

  getAll(): Alarm[] {
    const stmt = this.database.prepare(`

            SELECT *

            FROM alarms

            ORDER BY id DESC

        `);

    return stmt.all() as Alarm[];
  }
}
