import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration023: Migration = {
  version: 23,
  description: "Create licensing identity and activation workflow records",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS licensing_identities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        licensing_installation_id INTEGER NOT NULL UNIQUE,
        public_key_pem TEXT NOT NULL,
        hardware_fingerprint_json TEXT NOT NULL CHECK(json_valid(hardware_fingerprint_json)),
        fingerprint_schema_version INTEGER NOT NULL CHECK(fingerprint_schema_version > 0),
        registered_at TEXT NOT NULL,
        FOREIGN KEY(licensing_installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS license_activation_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_uuid TEXT NOT NULL UNIQUE,
        licensing_installation_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED','SUPERSEDED')),
        requested_at TEXT NOT NULL,
        decided_at TEXT,
        decided_by TEXT,
        decision_note TEXT,
        FOREIGN KEY(licensing_installation_id) REFERENCES licensing_installations(id) ON DELETE RESTRICT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_one_pending
        ON license_activation_requests(licensing_installation_id) WHERE status='PENDING';
      CREATE TABLE IF NOT EXISTS signed_license_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER NOT NULL UNIQUE,
        activation_request_id INTEGER NOT NULL UNIQUE,
        key_id TEXT NOT NULL,
        algorithm TEXT NOT NULL CHECK(algorithm='Ed25519'),
        certificate_json TEXT NOT NULL CHECK(json_valid(certificate_json)),
        certificate_sha256 TEXT NOT NULL UNIQUE,
        issued_at TEXT NOT NULL,
        FOREIGN KEY(license_id) REFERENCES site_bound_licenses(id) ON DELETE RESTRICT,
        FOREIGN KEY(activation_request_id) REFERENCES license_activation_requests(id) ON DELETE RESTRICT
      );
      CREATE TRIGGER IF NOT EXISTS trg_signed_certificates_no_update
      BEFORE UPDATE ON signed_license_certificates BEGIN SELECT RAISE(ABORT,'signed license certificates are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS trg_signed_certificates_no_delete
      BEFORE DELETE ON signed_license_certificates BEGIN SELECT RAISE(ABORT,'signed license certificates are immutable'); END;
    `);
  },
};
