import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration029: Migration = {
  version: 29,
  description: "Create persistent platform backup schedule",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS platform_backup_schedule (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
        interval_hours INTEGER NOT NULL DEFAULT 24 CHECK(interval_hours IN (6,12,24,168)),
        retention_count INTEGER NOT NULL DEFAULT 7 CHECK(retention_count BETWEEN 1 AND 30),
        next_run_at TEXT,
        last_started_at TEXT,
        last_completed_at TEXT,
        last_failure TEXT,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );

      INSERT OR IGNORE INTO platform_backup_schedule (
        id, enabled, interval_hours, retention_count, next_run_at,
        last_started_at, last_completed_at, last_failure, updated_at, updated_by
      ) VALUES (
        1, 0, 24, 7, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, 'SYSTEM'
      );
    `);
  },
};
