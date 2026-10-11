import type { Migration } from "../migration-runner";

export const migration033: Migration = {
  version: 33,
  description: "Create installation-bound offline ADMIN password recovery",
  up(database) {
    database.exec(`
      CREATE TABLE admin_offline_recovery (
        request_id TEXT PRIMARY KEY,
        installation_id TEXT NOT NULL,
        username TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        credential_hash TEXT,
        challenge_hash TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','CONSUMED')),
        grant_hash TEXT,
        grant_expires_at TEXT,
        signing_key_id TEXT,
        consumed_at TEXT
      );
      CREATE INDEX idx_admin_offline_recovery_expiry ON admin_offline_recovery(expires_at);
    `);
  },
};
