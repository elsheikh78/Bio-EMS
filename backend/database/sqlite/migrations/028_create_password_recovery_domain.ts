import type { Migration } from "../migration-runner";

export const migration028: Migration = {
  version: 28,
  description: "Create password recovery domain and forced password change state",
  up(database) {
    database.exec(`
      ALTER TABLE users ADD COLUMN password_change_required INTEGER NOT NULL DEFAULT 0 CHECK (password_change_required IN (0, 1));

      CREATE TABLE password_recovery_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT NOT NULL UNIQUE,
        principal_type TEXT NOT NULL CHECK (principal_type IN ('USER', 'SYSTEM_OWNER')),
        principal_id INTEGER,
        username_hint TEXT,
        installation_id TEXT,
        challenge_hash TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'CONSUMED', 'EXPIRED', 'REVOKED')),
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        approved_at DATETIME,
        consumed_at DATETIME,
        metadata_json TEXT,
        FOREIGN KEY (principal_id) REFERENCES users(id)
      );

      CREATE INDEX idx_password_recovery_requests_principal
        ON password_recovery_requests(principal_type, principal_id, status);
      CREATE INDEX idx_password_recovery_requests_expiry
        ON password_recovery_requests(expires_at, status);

      CREATE TABLE password_recovery_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        request_id TEXT,
        principal_type TEXT NOT NULL,
        principal_id INTEGER,
        actor_type TEXT NOT NULL,
        actor_id TEXT,
        outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
        occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        details_json TEXT,
        FOREIGN KEY (principal_id) REFERENCES users(id)
      );

      CREATE INDEX idx_password_recovery_audit_request
        ON password_recovery_audit(request_id, occurred_at);
    `);
  },
};
