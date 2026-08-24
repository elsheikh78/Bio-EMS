import { sqlite } from "../../database/sqlite/client";
import type Database from "better-sqlite3";
import type { Sensor } from "../entities/Sensor";

export type { Sensor } from "../entities/Sensor";

export interface SensorThresholdValues {
  warning_low: number | null;
  alarm_low: number | null;
  warning_high: number | null;
  alarm_high: number | null;
}

export interface SensorThresholdContext {
  sensor: Sensor;
  siteId: number;
}

export class SensorRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(sensor: Sensor): number {
    const stmt = this.database.prepare(`
            INSERT INTO sensors
            (
                uuid,
                room_id,
                device_id,
                channel,
                code,
                name,
                sensor_type,
                unit,
                min_value,
                max_value,
                warning_low,
                alarm_low,
                warning_high,
                alarm_high,
                product_grade,
                hardware_model,
                installation_date,
                calibration_status,
                last_calibrated_at,
                calibration_due_at,
                calibration_offset,
                certificate_reference,
                enabled
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    const result = stmt.run(
      sensor.uuid,

      sensor.room_id,

      sensor.device_id,

      sensor.channel,

      sensor.code,

      sensor.name,

      sensor.sensor_type,

      sensor.unit,

      sensor.min_value ?? null,

      sensor.max_value ?? null,

      sensor.warning_low ?? null,

      sensor.alarm_low ?? null,

      sensor.warning_high ?? null,

      sensor.alarm_high ?? null,

      sensor.product_grade ?? "STANDARD",

      sensor.hardware_model ?? null,

      sensor.installation_date ?? null,

      sensor.calibration_status ?? "NOT_CALIBRATED",

      sensor.last_calibrated_at ?? null,

      sensor.calibration_due_at ?? null,

      sensor.calibration_offset ?? 0,

      sensor.certificate_reference ?? null,

      sensor.enabled ?? 1
    );

    return Number(result.lastInsertRowid);
  }

  getAll(): Sensor[] {
    const stmt = this.database.prepare(`
            SELECT *
            FROM sensors
            ORDER BY id
        `);

    return stmt.all() as Sensor[];
  }

  findByDeviceAndChannel(deviceId: number, channel: number): Sensor | undefined {
    const stmt = this.database.prepare(`
            SELECT *
            FROM sensors
            WHERE device_id = ?
            AND channel = ?
            LIMIT 1
        `);

    return stmt.get(deviceId, channel) as Sensor | undefined;
  }

  findByCode(code: string): Sensor | undefined {
    const stmt = this.database.prepare(`
            SELECT *
            FROM sensors
            WHERE code = ?
            LIMIT 1
        `);

    return stmt.get(code) as Sensor | undefined;
  }

  findThresholdContextByUuid(uuid: string): SensorThresholdContext | undefined {
    const row = this.database
      .prepare(
        `SELECT sensors.*, rooms.site_id AS audit_site_id
         FROM sensors
         INNER JOIN rooms ON rooms.id = sensors.room_id
         WHERE sensors.uuid = ?
         LIMIT 1`
      )
      .get(uuid) as (Sensor & { audit_site_id: number }) | undefined;

    if (!row) return undefined;
    const { audit_site_id: siteId, ...sensor } = row;
    return { sensor, siteId };
  }

  updateThresholds(uuid: string, thresholds: SensorThresholdValues): Sensor | undefined {
    const result = this.database
      .prepare(
        `UPDATE sensors
         SET warning_low = ?, alarm_low = ?, warning_high = ?, alarm_high = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`
      )
      .run(
        thresholds.warning_low,
        thresholds.alarm_low,
        thresholds.warning_high,
        thresholds.alarm_high,
        uuid
      );

    return result.changes === 0 ? undefined : this.findThresholdContextByUuid(uuid)?.sensor;
  }
}
