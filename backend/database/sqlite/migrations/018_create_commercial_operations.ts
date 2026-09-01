import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration018: Migration = {
  version: 18,
  description: "Create isolated SYSTEM_OWNER commercial operations records",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS platform_customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','SUSPENDED','CLOSED')),
        created_at TEXT NOT NULL, created_by TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS platform_licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, site_id INTEGER,
        license_key_reference TEXT NOT NULL UNIQUE, edition TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','SUSPENDED','EXPIRED','REVOKED')),
        starts_at TEXT NOT NULL, expires_at TEXT, update_entitlement TEXT NOT NULL
          CHECK(update_entitlement IN ('NONE','FREE','PAID')),
        recorded_at TEXT NOT NULL, recorded_by TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS platform_maintenance_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, site_id INTEGER,
        event_type TEXT NOT NULL CHECK(event_type IN ('MAINTENANCE','CALIBRATION','SUPPORT','UPDATE')),
        due_at TEXT, status TEXT NOT NULL CHECK(status IN ('OPEN','SCHEDULED','COMPLETE','CANCELLED')),
        reference TEXT NOT NULL UNIQUE, note TEXT, recorded_at TEXT NOT NULL, recorded_by TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS platform_commercial_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL, occurred_at TEXT NOT NULL, actor_identity TEXT NOT NULL,
        snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json))
      );
      CREATE TRIGGER IF NOT EXISTS trg_platform_commercial_events_no_update
      BEFORE UPDATE ON platform_commercial_events BEGIN SELECT RAISE(ABORT, 'commercial events are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_platform_commercial_events_no_delete
      BEFORE DELETE ON platform_commercial_events BEGIN SELECT RAISE(ABORT, 'commercial events are append-only'); END;
    `);
  },
};
