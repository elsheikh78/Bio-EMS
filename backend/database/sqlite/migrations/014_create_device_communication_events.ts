import type Database from "better-sqlite3";

export const migration014 = {
  version: 14,
  description: "Create append-only Device communication history",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS device_communication_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('TELEMETRY','HEARTBEAT')),
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_device_communication_events_device_time
        ON device_communication_events(device_id, observed_at DESC, id DESC);
      CREATE TRIGGER IF NOT EXISTS trg_device_communication_events_no_update
      BEFORE UPDATE ON device_communication_events BEGIN
        SELECT RAISE(ABORT, 'device communication events are append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_device_communication_events_no_delete
      BEFORE DELETE ON device_communication_events BEGIN
        SELECT RAISE(ABORT, 'device communication events are append-only');
      END;
    `);
  },
};
