import type Database from "better-sqlite3";

export const migration006 = {
  version: 6,

  description: "Create immutable calibration records",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS calibration_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('PASS', 'FAIL')),
        performed_at TEXT NOT NULL,
        due_at TEXT,
        offset REAL,
        certificate_reference TEXT,
        notes TEXT,
        performed_by_user_id INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE RESTRICT,
        FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_calibration_records_sensor_performed
        ON calibration_records(sensor_id, performed_at DESC, id DESC);

      CREATE TRIGGER IF NOT EXISTS prevent_calibration_record_update
      BEFORE UPDATE ON calibration_records
      BEGIN
        SELECT RAISE(ABORT, 'calibration records are immutable');
      END;

      CREATE TRIGGER IF NOT EXISTS prevent_calibration_record_delete
      BEFORE DELETE ON calibration_records
      BEGIN
        SELECT RAISE(ABORT, 'calibration records are immutable');
      END;
    `);
  },
};
