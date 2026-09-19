import type Database from "better-sqlite3";

export const migration026 = {
  version: 26,
  description: "Harden System Owner MFA, sessions, lockout, and support grants",

  up(database: Database.Database): void {
    const columns = database.prepare("PRAGMA table_info(platform_principals)").all() as Array<{
      name: string;
    }>;
    const names = new Set(columns.map(({ name }) => name));
    const additions = [
      ["mfa_secret_encrypted", "TEXT"],
      ["mfa_enabled_at", "TEXT"],
      ["mfa_recovery_hashes", "TEXT"],
      ["failed_login_count", "INTEGER NOT NULL DEFAULT 0"],
      ["locked_until", "TEXT"],
      ["last_failed_login_at", "TEXT"],
      ["session_version", "INTEGER NOT NULL DEFAULT 1"],
    ] as const;
    for (const [name, definition] of additions) {
      if (!names.has(name)) {
        database.exec(`ALTER TABLE platform_principals ADD COLUMN ${name} ${definition}`);
      }
    }

    database.exec(`
      CREATE TABLE IF NOT EXISTS platform_sessions (
        id TEXT PRIMARY KEY,
        principal_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        revoked_at TEXT,
        revoked_reason TEXT,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY(principal_id) REFERENCES platform_principals(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_platform_sessions_principal_active
        ON platform_sessions(principal_id, revoked_at, expires_at);

      CREATE TABLE IF NOT EXISTS owner_support_grants (
        id TEXT PRIMARY KEY,
        principal_id TEXT NOT NULL,
        site_id INTEGER,
        reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 8 AND 500),
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        created_by TEXT NOT NULL,
        FOREIGN KEY(principal_id) REFERENCES platform_principals(id) ON DELETE CASCADE,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE,
        CHECK(expires_at > issued_at)
      );

      CREATE INDEX IF NOT EXISTS idx_owner_support_grants_active
        ON owner_support_grants(principal_id, site_id, revoked_at, expires_at);

      CREATE TRIGGER IF NOT EXISTS trg_owner_support_grants_no_update_scope
      BEFORE UPDATE OF principal_id, site_id, reason, issued_at, expires_at, created_by
      ON owner_support_grants
      BEGIN
        SELECT RAISE(ABORT, 'support grant scope is immutable');
      END;
    `);
  },
};
