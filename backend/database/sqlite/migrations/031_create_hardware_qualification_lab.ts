import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration031: Migration = {
  version: 31,
  description: "Create manufacturer hardware qualification lab domain",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS hardware_test_runs (
        id TEXT PRIMARY KEY,
        run_code TEXT NOT NULL UNIQUE,
        prototype_type TEXT NOT NULL CHECK(prototype_type IN ('MAIN16_SIMD4')),
        status TEXT NOT NULL CHECK(status IN (
          'NOT_STARTED','SETUP','FLASHING','TESTING','ENDURANCE','PASS','FAIL'
        )),
        operator TEXT NOT NULL,
        main_hardware_uid TEXT,
        sim_serial TEXT,
        hardware_profile_rev TEXT NOT NULL,
        test_profile_rev TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hardware_test_steps (
        run_id TEXT NOT NULL,
        step_code TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        title TEXT NOT NULL,
        execution_mode TEXT NOT NULL CHECK(execution_mode IN ('AUTO','MANUAL','HYBRID')),
        status TEXT NOT NULL CHECK(status IN ('PENDING','RUNNING','PASS','FAIL','SKIPPED')),
        acceptance_rule TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        notes TEXT,
        metrics_json TEXT,
        PRIMARY KEY(run_id, step_code),
        FOREIGN KEY(run_id) REFERENCES hardware_test_runs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_firmware (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        target TEXT NOT NULL CHECK(target IN ('MAIN16','SIMD4','SITE_CONTROLLER')),
        firmware_name TEXT NOT NULL,
        version TEXT NOT NULL,
        git_commit TEXT,
        sha256 TEXT,
        chip TEXT NOT NULL,
        port TEXT,
        flash_status TEXT NOT NULL CHECK(flash_status IN ('PENDING','PASS','FAIL')),
        tool_output TEXT,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES hardware_test_runs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        step_code TEXT NOT NULL,
        metric_key TEXT NOT NULL,
        value_real REAL,
        value_text TEXT,
        unit TEXT,
        channel TEXT,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY(run_id, step_code) REFERENCES hardware_test_steps(run_id, step_code)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hardware_test_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        step_code TEXT,
        event_code TEXT NOT NULL,
        expected TEXT,
        observed TEXT,
        severity TEXT NOT NULL CHECK(severity IN ('INFO','WARNING','ERROR')),
        recorded_at TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES hardware_test_runs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_hardware_test_runs_created
        ON hardware_test_runs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_steps_status
        ON hardware_test_steps(run_id, status, sequence);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_measurements_step
        ON hardware_test_measurements(run_id, step_code, recorded_at);
      CREATE INDEX IF NOT EXISTS idx_hardware_test_events_run
        ON hardware_test_events(run_id, recorded_at);
    `);
  },
};
