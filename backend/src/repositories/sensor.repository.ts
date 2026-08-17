import { sqlite } from "../../database/sqlite/client";
import type { Sensor } from "../entities/Sensor";

export type { Sensor } from "../entities/Sensor";

export class SensorRepository {
  create(sensor: Sensor): number {
    const stmt = sqlite.prepare(`
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
    const stmt = sqlite.prepare(`
            SELECT *
            FROM sensors
            ORDER BY id
        `);

    return stmt.all() as Sensor[];
  }

  findByDeviceAndChannel(deviceId: number, channel: number): Sensor | undefined {
    const stmt = sqlite.prepare(`
            SELECT *
            FROM sensors
            WHERE device_id = ?
            AND channel = ?
            LIMIT 1
        `);

    return stmt.get(deviceId, channel) as Sensor | undefined;
  }

  findByCode(code: string): Sensor | undefined {
    const stmt = sqlite.prepare(`
            SELECT *
            FROM sensors
            WHERE code = ?
            LIMIT 1
        `);

    return stmt.get(code) as Sensor | undefined;
  }
}
