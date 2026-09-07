import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration024: Migration = {
  version: 24,
  description: "Create licensed device, validation and transfer governance",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS licensed_device_bindings (
        id INTEGER PRIMARY KEY AUTOINCREMENT, license_id INTEGER NOT NULL,
        device_id INTEGER NOT NULL, device_identity TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('AUTHORIZED','REVOKED')),
        bound_at TEXT NOT NULL, bound_by TEXT NOT NULL, revoked_at TEXT, revoked_by TEXT,
        UNIQUE(license_id,device_id), UNIQUE(license_id,device_identity),
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT,
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS license_validation_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, license_id INTEGER NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('VALID','OFFLINE_GRACE','RESTRICTED')),
        validated_at TEXT NOT NULL, next_validation_at TEXT, evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS license_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, license_id INTEGER NOT NULL,
        from_installation_id INTEGER NOT NULL, to_installation_id INTEGER NOT NULL,
        reason TEXT NOT NULL, transferred_at TEXT NOT NULL, transferred_by TEXT NOT NULL,
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT,
        FOREIGN KEY(from_installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(to_installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT,
        CHECK(from_installation_id <> to_installation_id)
      );
      CREATE TRIGGER IF NOT EXISTS trg_license_validations_no_update BEFORE UPDATE ON license_validation_events BEGIN SELECT RAISE(ABORT,'license validations are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_license_validations_no_delete BEFORE DELETE ON license_validation_events BEGIN SELECT RAISE(ABORT,'license validations are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_license_transfers_no_update BEFORE UPDATE ON license_transfers BEGIN SELECT RAISE(ABORT,'license transfers are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_license_transfers_no_delete BEFORE DELETE ON license_transfers BEGIN SELECT RAISE(ABORT,'license transfers are append-only'); END;
    `);
  },
};
