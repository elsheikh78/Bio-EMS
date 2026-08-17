import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import type { CalibrationRecord } from "../entities/CalibrationRecord";
import type { CreateCalibrationRecordInput } from "../modules/calibration/dto/calibration.schema";

export class CalibrationRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(
    sensorUuid: string,
    input: CreateCalibrationRecordInput,
    performedByUserId: number
  ): CalibrationRecord | undefined {
    return this.database.transaction(() => {
      const sensor = this.database
        .prepare("SELECT id FROM sensors WHERE uuid = ? LIMIT 1")
        .get(sensorUuid) as { id: number } | undefined;

      if (!sensor) return undefined;

      const result = this.database
        .prepare(
          `INSERT INTO calibration_records (
            sensor_id, result, performed_at, due_at, offset,
            certificate_reference, notes, performed_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          sensor.id,
          input.result,
          input.performed_at,
          input.due_at ?? null,
          input.offset ?? null,
          input.certificate_reference ?? null,
          input.notes ?? null,
          performedByUserId
        );

      if (input.result === "PASS") {
        this.database
          .prepare(
            `UPDATE sensors
             SET calibration_status = 'VALID',
                 last_calibrated_at = ?,
                 calibration_due_at = ?,
                 calibration_offset = ?,
                 certificate_reference = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .run(
            input.performed_at,
            input.due_at,
            input.offset,
            input.certificate_reference ?? null,
            sensor.id
          );
      }

      return this.findById(Number(result.lastInsertRowid));
    })();
  }

  listBySensorUuid(sensorUuid: string): CalibrationRecord[] | undefined {
    const sensor = this.database
      .prepare("SELECT id FROM sensors WHERE uuid = ? LIMIT 1")
      .get(sensorUuid) as { id: number } | undefined;

    if (!sensor) return undefined;

    return this.database
      .prepare(
        `SELECT calibration_records.*, sensors.uuid AS sensor_uuid,
                users.username AS performed_by_username
         FROM calibration_records
         INNER JOIN sensors ON sensors.id = calibration_records.sensor_id
         INNER JOIN users ON users.id = calibration_records.performed_by_user_id
         WHERE calibration_records.sensor_id = ?
         ORDER BY calibration_records.performed_at DESC, calibration_records.id DESC`
      )
      .all(sensor.id) as CalibrationRecord[];
  }

  private findById(id: number): CalibrationRecord {
    return this.database
      .prepare(
        `SELECT calibration_records.*, sensors.uuid AS sensor_uuid,
                users.username AS performed_by_username
         FROM calibration_records
         INNER JOIN sensors ON sensors.id = calibration_records.sensor_id
         INNER JOIN users ON users.id = calibration_records.performed_by_user_id
         WHERE calibration_records.id = ?`
      )
      .get(id) as CalibrationRecord;
  }
}
