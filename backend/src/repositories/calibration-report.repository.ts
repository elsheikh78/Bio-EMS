import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";

export interface CalibrationReportSensorRow {
  id: number;
  uuid: string;
  code: string;
  name: string;
  sensor_type: string;
  unit: string;
  product_grade: string;
  hardware_model: string | null;
  calibration_status: string;
  last_calibrated_at: string | null;
  calibration_due_at: string | null;
  calibration_offset: number;
  certificate_reference: string | null;
  room_uuid: string;
  room_code: string;
  room_name: string;
  site_code: string;
  site_name: string;
}

export interface CalibrationReportRecordRow {
  id: number;
  sensor_uuid: string;
  result: "PASS" | "FAIL";
  performed_at: string;
  due_at: string | null;
  offset: number | null;
  certificate_reference: string | null;
  notes: string | null;
  performed_by_username: string;
}

export class CalibrationReportRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  findSensors(sensorUuids: string[]): CalibrationReportSensorRow[] {
    const placeholders = sensorUuids.map(() => "?").join(", ");
    return this.database
      .prepare(
        `SELECT sensors.id, sensors.uuid, sensors.code, sensors.name, sensors.sensor_type,
              sensors.unit, sensors.product_grade, sensors.hardware_model,
              sensors.calibration_status, sensors.last_calibrated_at,
              sensors.calibration_due_at, sensors.calibration_offset,
              sensors.certificate_reference, rooms.uuid AS room_uuid,
              rooms.code AS room_code, rooms.name AS room_name,
              sites.code AS site_code, sites.name AS site_name
       FROM sensors
       INNER JOIN rooms ON rooms.id = sensors.room_id
       INNER JOIN sites ON sites.id = rooms.site_id
       WHERE sensors.uuid IN (${placeholders})
       ORDER BY sites.code, rooms.code, sensors.code`
      )
      .all(...sensorUuids) as CalibrationReportSensorRow[];
  }

  findRecords(sensorUuids: string[], from: string, to: string): CalibrationReportRecordRow[] {
    const placeholders = sensorUuids.map(() => "?").join(", ");
    return this.database
      .prepare(
        `SELECT calibration_records.id, sensors.uuid AS sensor_uuid,
              calibration_records.result, calibration_records.performed_at,
              calibration_records.due_at, calibration_records.offset,
              calibration_records.certificate_reference, calibration_records.notes,
              users.username AS performed_by_username
       FROM calibration_records
       INNER JOIN sensors ON sensors.id = calibration_records.sensor_id
       INNER JOIN users ON users.id = calibration_records.performed_by_user_id
       WHERE sensors.uuid IN (${placeholders})
         AND julianday(calibration_records.performed_at) >= julianday(?)
         AND julianday(calibration_records.performed_at) < julianday(?)
       ORDER BY calibration_records.performed_at DESC, calibration_records.id DESC`
      )
      .all(...sensorUuids, from, to) as CalibrationReportRecordRow[];
  }
}
