import type Database from "better-sqlite3";

export const migration012 = {
  version: 12,
  description: "Create Site-scoped notification recipient directory",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS notification_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        site_id INTEGER NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN (
          'PRIMARY_CONTACT', 'QUALITY', 'ENGINEERING', 'SECURITY', 'MANAGEMENT', 'OTHER'
        )),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_notification_recipients_site_status
        ON notification_recipients(site_id, status, id);

      CREATE TABLE IF NOT EXISTS notification_recipient_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('EMAIL', 'SMS', 'WHATSAPP')),
        address TEXT NOT NULL,
        eligible_severities_json TEXT NOT NULL CHECK(
          eligible_severities_json IN ('["WARNING"]', '["CRITICAL"]', '["WARNING","CRITICAL"]')
        ),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (recipient_id) REFERENCES notification_recipients(id) ON DELETE CASCADE,
        UNIQUE(recipient_id, channel)
      );
    `);
  },
};
