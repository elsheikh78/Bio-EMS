import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration030: Migration = {
  version: 30,
  description: "Create Pilot device-to-platform pairing and binding domain",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS device_pairing_sessions (
        id TEXT PRIMARY KEY,
        installation_id INTEGER NOT NULL,
        device_identity TEXT NOT NULL,
        code_hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('PENDING','CLAIMED','EXPIRED','REVOKED')),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        claimed_at TEXT,
        hardware_uid TEXT,
        firmware_version TEXT,
        protocol_version TEXT,
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_device_pairing_sessions_device
        ON device_pairing_sessions(installation_id, device_identity, status, expires_at);

      CREATE TABLE IF NOT EXISTS device_platform_bindings (
        platform_binding_id TEXT PRIMARY KEY,
        binding_schema_version INTEGER NOT NULL CHECK(binding_schema_version = 1),
        installation_id INTEGER NOT NULL,
        pairing_session_id TEXT NOT NULL UNIQUE,
        device_identity TEXT NOT NULL,
        hardware_uid TEXT NOT NULL UNIQUE,
        site_code TEXT NOT NULL,
        firmware_version TEXT NOT NULL,
        protocol_version TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','REVOKED','REPLACED')),
        paired_at TEXT NOT NULL,
        revoked_at TEXT,
        revoked_by TEXT,
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(pairing_session_id) REFERENCES device_pairing_sessions(id) ON DELETE RESTRICT,
        UNIQUE(installation_id, device_identity)
      );

      CREATE INDEX IF NOT EXISTS idx_device_platform_bindings_installation
        ON device_platform_bindings(installation_id, status);

      CREATE TRIGGER IF NOT EXISTS trg_device_platform_bindings_identity_immutable
      BEFORE UPDATE ON device_platform_bindings
      WHEN NEW.platform_binding_id <> OLD.platform_binding_id
        OR NEW.binding_schema_version <> OLD.binding_schema_version
        OR NEW.installation_id <> OLD.installation_id
        OR NEW.pairing_session_id <> OLD.pairing_session_id
        OR NEW.device_identity <> OLD.device_identity
        OR NEW.hardware_uid <> OLD.hardware_uid
        OR NEW.site_code <> OLD.site_code
        OR NEW.paired_at <> OLD.paired_at
      BEGIN
        SELECT RAISE(ABORT, 'device platform binding identity is immutable');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_device_platform_bindings_no_delete
      BEFORE DELETE ON device_platform_bindings
      BEGIN
        SELECT RAISE(ABORT, 'device platform bindings are retained for audit');
      END;
    `);
  },
};
