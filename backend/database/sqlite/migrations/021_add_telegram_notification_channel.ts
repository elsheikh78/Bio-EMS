import type Database from "better-sqlite3";

export const migration021 = {
  version: 21,
  description: "Add Telegram notification channel",
  up(database: Database.Database): void {
    const hasSites = Boolean(
      database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'sites'").get()
    );
    if (!hasSites) database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY);");
    database.exec(`
      DROP TRIGGER IF EXISTS notification_delivery_attempts_no_update;
      DROP TRIGGER IF EXISTS notification_delivery_attempts_no_delete;

      ALTER TABLE notification_delivery_attempts RENAME TO notification_delivery_attempts_v20;
      ALTER TABLE notification_deliveries RENAME TO notification_deliveries_v20;
      ALTER TABLE notification_recipient_endpoints RENAME TO notification_recipient_endpoints_v20;

      CREATE TABLE notification_recipient_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM')),
        address TEXT NOT NULL,
        eligible_severities_json TEXT NOT NULL CHECK(
          eligible_severities_json IN ('["WARNING"]', '["CRITICAL"]', '["WARNING","CRITICAL"]')
        ),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (recipient_id) REFERENCES notification_recipients(id) ON DELETE CASCADE,
        UNIQUE(recipient_id, channel)
      );

      CREATE TABLE notification_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        notification_event_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('EMAIL','SMS','WHATSAPP','TELEGRAM')),
        severity TEXT NOT NULL CHECK(severity IN ('WARNING','CRITICAL')),
        status TEXT NOT NULL DEFAULT 'PENDING'
          CHECK(status IN ('PENDING','PROCESSING','SENT','DELIVERED','RETRY_WAIT','FAILED','DEAD_LETTER','CANCELLED')),
        idempotency_key TEXT NOT NULL UNIQUE,
        attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
        max_attempts INTEGER NOT NULL DEFAULT 5 CHECK(max_attempts BETWEEN 1 AND 20),
        next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        claimed_at TEXT,
        claim_token TEXT,
        provider_message_id TEXT,
        sent_at TEXT,
        delivered_at TEXT,
        failed_at TEXT,
        last_error_code TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (notification_event_id) REFERENCES notification_events(id),
        FOREIGN KEY (site_id) REFERENCES sites(id),
        FOREIGN KEY (recipient_id) REFERENCES notification_recipients(id)
      );

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

      INSERT INTO notification_recipient_endpoints
      SELECT * FROM notification_recipient_endpoints_v20;
      INSERT INTO notification_deliveries
      SELECT * FROM notification_deliveries_v20;
      INSERT INTO notification_delivery_attempts
      SELECT * FROM notification_delivery_attempts_v20;

      DROP TABLE notification_delivery_attempts_v20;
      DROP TABLE notification_deliveries_v20;
      DROP TABLE notification_recipient_endpoints_v20;

      CREATE INDEX idx_notification_deliveries_due
        ON notification_deliveries(status, next_attempt_at, id);
      CREATE INDEX idx_notification_deliveries_site
        ON notification_deliveries(site_id, created_at DESC);
      CREATE TRIGGER notification_delivery_attempts_no_update
      BEFORE UPDATE ON notification_delivery_attempts
      BEGIN SELECT RAISE(ABORT, 'notification delivery attempts are append-only'); END;
      CREATE TRIGGER notification_delivery_attempts_no_delete
      BEFORE DELETE ON notification_delivery_attempts
      BEGIN SELECT RAISE(ABORT, 'notification delivery attempts are append-only'); END;
    `);
    if (!hasSites) database.exec("DROP TABLE sites;");
  },
};
