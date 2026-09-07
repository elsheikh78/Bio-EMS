import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration022: Migration = {
  version: 22,
  description: "Create site-bound licensing domain records",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS licensing_installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        installation_uuid TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        provisioning_installation_id INTEGER UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('PENDING','ACTIVE','SUSPENDED','REVOKED','RETIRED')),
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE RESTRICT,
        FOREIGN KEY(provisioning_installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_licensing_installations_scope
        ON licensing_installations(customer_id,site_id,status);

      CREATE TABLE IF NOT EXISTS site_bound_licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_uuid TEXT NOT NULL UNIQUE,
        installation_id INTEGER NOT NULL,
        schema_version INTEGER NOT NULL CHECK(schema_version > 0),
        license_type TEXT NOT NULL CHECK(license_type IN ('TRIAL','SUBSCRIPTION','PERPETUAL')),
        status TEXT NOT NULL CHECK(status IN ('DRAFT','ISSUED','ACTIVE','SUSPENDED','EXPIRED','REVOKED','SUPERSEDED')),
        issued_at TEXT,
        starts_at TEXT NOT NULL,
        expires_at TEXT,
        maintenance_until TEXT,
        update_entitlement TEXT NOT NULL CHECK(update_entitlement IN ('NONE','FREE','PAID')),
        offline_policy_json TEXT NOT NULL CHECK(json_valid(offline_policy_json)),
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        FOREIGN KEY(installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT,
        CHECK(expires_at IS NULL OR expires_at > starts_at)
      );
      CREATE INDEX IF NOT EXISTS idx_site_bound_licenses_installation
        ON site_bound_licenses(installation_id,status,id DESC);

      CREATE TABLE IF NOT EXISTS license_entitlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER NOT NULL,
        module_code TEXT NOT NULL,
        enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
        maximum_gateways INTEGER CHECK(maximum_gateways IS NULL OR maximum_gateways >= 0),
        maximum_devices INTEGER CHECK(maximum_devices IS NULL OR maximum_devices >= 0),
        maximum_sensors INTEGER CHECK(maximum_sensors IS NULL OR maximum_sensors >= 0),
        UNIQUE(license_id,module_code),
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS license_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        installation_id INTEGER NOT NULL,
        license_id INTEGER,
        event_type TEXT NOT NULL,
        actor_identity TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
        FOREIGN KEY(installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_license_events_scope
        ON license_events(installation_id,occurred_at DESC,id DESC);
      CREATE TRIGGER IF NOT EXISTS trg_license_events_no_update
      BEFORE UPDATE ON license_events BEGIN SELECT RAISE(ABORT,'license events are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_license_events_no_delete
      BEFORE DELETE ON license_events BEGIN SELECT RAISE(ABORT,'license events are append-only'); END;
    `);
  },
};
