import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration017: Migration = {
  version: 17,
  description: "Create commissioning session and append-only evidence persistence",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS commissioning_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        site_id INTEGER NOT NULL,
        controller_identity TEXT,
        platform_version TEXT NOT NULL,
        commissioning_revision TEXT NOT NULL,
        engineer_identity TEXT NOT NULL,
        witness_identity TEXT,
        status TEXT NOT NULL DEFAULT 'OPEN'
          CHECK(status IN ('OPEN','READY_FOR_DECISION','ACCEPTED','REJECTED','CANCELLED')),
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_commissioning_sessions_site_time
        ON commissioning_sessions(site_id, opened_at DESC, id DESC);

      CREATE TABLE IF NOT EXISTS commissioning_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        check_key TEXT NOT NULL,
        title TEXT NOT NULL,
        mandatory INTEGER NOT NULL DEFAULT 1 CHECK(mandatory IN (0,1)),
        physical_or_live_gate INTEGER NOT NULL DEFAULT 0 CHECK(physical_or_live_gate IN (0,1)),
        sensor_id INTEGER,
        device_id INTEGER,
        map_id TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES commissioning_sessions(id) ON DELETE RESTRICT,
        FOREIGN KEY(sensor_id) REFERENCES sensors(id) ON DELETE RESTRICT,
        FOREIGN KEY(device_id) REFERENCES devices(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_commissioning_checks_session
        ON commissioning_checks(session_id, id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_commissioning_checks_identity
        ON commissioning_checks(
          session_id,
          check_key,
          COALESCE(sensor_id, -1),
          COALESCE(device_id, -1),
          COALESCE(map_id, '')
        );

      CREATE TABLE IF NOT EXISTS commissioning_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        check_id INTEGER NOT NULL,
        state TEXT NOT NULL
          CHECK(state IN ('NOT_RUN','PASS','FAIL','BLOCKED','DEFERRED_NON_BLOCKING')),
        evidence_kind TEXT NOT NULL
          CHECK(evidence_kind IN ('SOFTWARE_AUTOMATED','PHYSICAL','LIVE_PROVIDER','DOCUMENTARY')),
        executed_at TEXT NOT NULL,
        actor_identity TEXT NOT NULL,
        witness_identity TEXT,
        evidence_reference TEXT,
        deviation_reference TEXT,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES commissioning_sessions(id) ON DELETE RESTRICT,
        FOREIGN KEY(check_id) REFERENCES commissioning_checks(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_commissioning_evidence_check_time
        ON commissioning_evidence(check_id, executed_at DESC, id DESC);

      CREATE TABLE IF NOT EXISTS commissioning_deviations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        reference TEXT NOT NULL,
        classification TEXT NOT NULL CHECK(classification IN ('BLOCKING','NON_BLOCKING')),
        description TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        actor_identity TEXT NOT NULL,
        evidence_reference TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES commissioning_sessions(id) ON DELETE RESTRICT,
        UNIQUE(session_id, reference)
      );

      CREATE TABLE IF NOT EXISTS commissioning_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        decision TEXT NOT NULL CHECK(decision IN ('ACCEPTED','REJECTED')),
        decided_at TEXT NOT NULL,
        actor_identity TEXT NOT NULL,
        witness_identity TEXT,
        note TEXT,
        snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES commissioning_sessions(id) ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_commissioning_decisions_session_time
        ON commissioning_decisions(session_id, decided_at DESC, id DESC);

      CREATE TRIGGER IF NOT EXISTS trg_commissioning_evidence_no_update
      BEFORE UPDATE ON commissioning_evidence BEGIN
        SELECT RAISE(ABORT, 'commissioning evidence is append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_commissioning_evidence_no_delete
      BEFORE DELETE ON commissioning_evidence BEGIN
        SELECT RAISE(ABORT, 'commissioning evidence is append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_commissioning_deviations_no_update
      BEFORE UPDATE ON commissioning_deviations BEGIN
        SELECT RAISE(ABORT, 'commissioning deviations are append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_commissioning_deviations_no_delete
      BEFORE DELETE ON commissioning_deviations BEGIN
        SELECT RAISE(ABORT, 'commissioning deviations are append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_commissioning_decisions_no_update
      BEFORE UPDATE ON commissioning_decisions BEGIN
        SELECT RAISE(ABORT, 'commissioning decisions are append-only');
      END;
      CREATE TRIGGER IF NOT EXISTS trg_commissioning_decisions_no_delete
      BEFORE DELETE ON commissioning_decisions BEGIN
        SELECT RAISE(ABORT, 'commissioning decisions are append-only');
      END;
    `);
  },
};
