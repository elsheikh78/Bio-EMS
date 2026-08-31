import type Database from "better-sqlite3";

export const migration016 = {
  version: 16,
  description: "Add append-only notification attempt phases",
  up(database: Database.Database): void {
    const columns = database
      .prepare("PRAGMA table_info(notification_delivery_attempts)")
      .all() as Array<{ name: string }>;
    if (columns.some((column) => column.name === "phase")) return;
    database.exec(`
      DROP TRIGGER IF EXISTS notification_delivery_attempts_no_update;
      DROP TRIGGER IF EXISTS notification_delivery_attempts_no_delete;
      ALTER TABLE notification_delivery_attempts RENAME TO notification_delivery_attempts_v15;
      CREATE TABLE notification_delivery_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_id INTEGER NOT NULL,
        attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
        phase TEXT NOT NULL CHECK(phase IN ('START','RESULT')),
        status TEXT NOT NULL CHECK(status IN ('STARTED','SENT','DELIVERED','FAILED','TIMEOUT')),
        provider TEXT NOT NULL,
        provider_message_id TEXT,
        error_code TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (delivery_id) REFERENCES notification_deliveries(id) ON DELETE CASCADE,
        UNIQUE(delivery_id, attempt_number, phase)
      );
      INSERT INTO notification_delivery_attempts
        (id, delivery_id, attempt_number, phase, status, provider, provider_message_id,
         error_code, started_at, completed_at)
      SELECT id, delivery_id, attempt_number, 'START', status, provider, provider_message_id,
        error_code, started_at, completed_at FROM notification_delivery_attempts_v15;
      DROP TABLE notification_delivery_attempts_v15;
      CREATE TRIGGER notification_delivery_attempts_no_update
      BEFORE UPDATE ON notification_delivery_attempts
      BEGIN SELECT RAISE(ABORT, 'notification delivery attempts are append-only'); END;
      CREATE TRIGGER notification_delivery_attempts_no_delete
      BEFORE DELETE ON notification_delivery_attempts
      BEGIN SELECT RAISE(ABORT, 'notification delivery attempts are append-only'); END;
    `);
  },
};
