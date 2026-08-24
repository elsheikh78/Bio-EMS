import type Database from "better-sqlite3";

export const migration010 = {
  version: 10,
  description: "Create append-only system audit event storage",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 128),
        occurred_at TEXT NOT NULL CHECK(length(occurred_at) > 0),
        actor_kind TEXT NOT NULL CHECK(actor_kind IN ('CUSTOMER_USER', 'PLATFORM')),
        actor_id TEXT NOT NULL CHECK(length(actor_id) > 0),
        actor_username TEXT NOT NULL CHECK(length(actor_username) > 0),
        actor_role TEXT NOT NULL CHECK(length(actor_role) > 0),
        action TEXT NOT NULL CHECK(length(action) BETWEEN 1 AND 128),
        target_type TEXT,
        target_id TEXT,
        site_id INTEGER,
        result TEXT NOT NULL CHECK(result IN ('SUCCESS', 'DENIED', 'FAILED')),
        previous_values_json TEXT CHECK(
          previous_values_json IS NULL OR json_valid(previous_values_json)
        ),
        new_values_json TEXT CHECK(
          new_values_json IS NULL OR json_valid(new_values_json)
        ),
        request_id TEXT,
        session_id TEXT,
        correlation_id TEXT,
        reason TEXT,
        source_context TEXT NOT NULL CHECK(length(source_context) BETWEEN 1 AND 128),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK((target_type IS NULL) = (target_id IS NULL)),
        FOREIGN KEY(site_id) REFERENCES sites(id)
      );

      CREATE INDEX IF NOT EXISTS idx_audit_events_site_order
        ON audit_events(site_id, occurred_at DESC, id DESC);

      CREATE INDEX IF NOT EXISTS idx_audit_events_actor_order
        ON audit_events(actor_kind, actor_id, occurred_at DESC, id DESC);

      CREATE TRIGGER IF NOT EXISTS trg_audit_events_no_update
      BEFORE UPDATE ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'audit_events are append-only');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_audit_events_no_delete
      BEFORE DELETE ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'audit_events are append-only');
      END;
    `);
  },
};
