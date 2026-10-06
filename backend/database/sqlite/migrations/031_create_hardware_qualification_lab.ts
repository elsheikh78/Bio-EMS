import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration031: Migration = {
  version: 31,
  description: "Create System Owner hardware qualification lab",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS hardware_test_runs (
        id TEXT PRIMARY KEY,
        run_number TEXT NOT NULL UNIQUE,
        profile_revision TEXT NOT NULL,
        prototype_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NOT_STARTED'
          CHECK(status IN ('NOT_STARTED','TESTING','QUALIFIED','FAILED')),
        main_hardware_uid TEXT,
        sim_d4_serial TEXT,
        operator_principal_id TEXT NOT NULL,
        operator_username TEXT NOT NULL,
        main_firmware_version TEXT,
        sim_firmware_version TEXT,
        main_firmware_sha256 TEXT,
        sim_firmware_sha256 TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY(operator_principal_id)
          REFERENCES platform_principals(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS hardware_test_steps (
        run_id TEXT NOT NULL,
        step_key TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING'
          CHECK(status IN ('PENDING','PASS','FAIL')),
        evidence_json TEXT NOT NULL DEFAULT '{}'
          CHECK(json_valid(evidence_json)),
        evaluation_json TEXT NOT NULL DEFAULT '{}'
          CHECK(json_valid(evaluation_json)),
        recorded_by TEXT,
        recorded_at TEXT,
        PRIMARY KEY(run_id, step_key),
        FOREIGN KEY(run_id) REFERENCES hardware_test_runs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        step_key TEXT NOT NULL,
        channel TEXT,
        metric_key TEXT NOT NULL,
        numeric_value REAL,
        text_value TEXT,
        unit TEXT,
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK(numeric_value IS NOT NULL OR text_value IS NOT NULL),
        FOREIGN KEY(run_id, step_key)
          REFERENCES hardware_test_steps(run_id, step_key) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        step_key TEXT NOT NULL,
        code TEXT NOT NULL,
        severity TEXT NOT NULL
          CHECK(severity IN ('INFO','WARNING','ERROR')),
        payload_json TEXT NOT NULL DEFAULT '{}'
          CHECK(json_valid(payload_json)),
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id, step_key)
          REFERENCES hardware_test_steps(run_id, step_key) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_firmware (
        run_id TEXT NOT NULL,
        target TEXT NOT NULL
          CHECK(target IN ('MAIN16_BENCH','SIMD4_BENCH','SITE_CONTROLLER_PILOT')),
        firmware_name TEXT NOT NULL,
        firmware_version TEXT NOT NULL,
        sha256 TEXT,
        source_commit TEXT,
        port TEXT,
        flash_result TEXT NOT NULL
          CHECK(flash_result IN ('RECORDED','PASS','FAIL')),
        evidence_json TEXT NOT NULL DEFAULT '{}'
          CHECK(json_valid(evidence_json)),
        flashed_at TEXT NOT NULL,
        PRIMARY KEY(run_id, target),
        FOREIGN KEY(run_id) REFERENCES hardware_test_runs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_hardware_test_runs_created
        ON hardware_test_runs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_steps_run_order
        ON hardware_test_steps(run_id, step_order);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_measurements_run_step_time
        ON hardware_test_measurements(run_id, step_key, observed_at);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_events_run_step_time
        ON hardware_test_events(run_id, step_key, observed_at);
    `);
  },
};
