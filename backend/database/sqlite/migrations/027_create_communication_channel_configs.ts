import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration027: Migration = {
  version: 27,
  description: "Create encrypted customer communication channel configuration",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS communication_channel_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        site_id INTEGER,
        channel TEXT NOT NULL CHECK(channel IN ('EMAIL','TELEGRAM','WHATSAPP','SMS')),
        enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
        priority INTEGER NOT NULL DEFAULT 1 CHECK(priority BETWEEN 1 AND 4),
        config_json TEXT NOT NULL CHECK(json_valid(config_json)),
        secrets_encrypted TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE CASCADE,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_channel_customer
        ON communication_channel_configs(customer_id, channel)
        WHERE site_id IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_channel_site
        ON communication_channel_configs(customer_id, site_id, channel)
        WHERE site_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_communication_channel_scope
        ON communication_channel_configs(customer_id, site_id, enabled, priority);
    `);
  },
};
