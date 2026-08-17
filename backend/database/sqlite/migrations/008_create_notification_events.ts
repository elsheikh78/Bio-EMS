import type Database from "better-sqlite3";

export const migration008 = {
  version: 8,
  description: "Create channel-independent notification event outbox",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS notification_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL CHECK(event_type IN (
          'ALARM_TRIGGERED',
          'ALARM_RECOVERED',
          'ALARM_ACKNOWLEDGED',
          'DEVICE_STALE',
          'DEVICE_OFFLINE',
          'DEVICE_ONLINE'
        )),
        source_type TEXT NOT NULL CHECK(source_type IN ('ALARM', 'DEVICE')),
        source_id TEXT NOT NULL,
        deduplication_key TEXT NOT NULL UNIQUE,
        payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
        occurred_at TEXT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notification_events_pending
        ON notification_events(consumed_at, id);
    `);
  },
};
