import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

export const migration020: Migration = {
  version: 20,
  description: "Create controlled installation revision and acceptance lifecycle",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS platform_installations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('DRAFT','VALIDATED','PENDING_DELIVERY','SENT','CONFIG_ACTIVE','CUSTOMER_ACCEPTANCE_PENDING','COMMISSIONED','CORRECTION_REQUIRED')),
        active_revision_id INTEGER, created_at TEXT NOT NULL, created_by TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(active_revision_id) REFERENCES platform_installation_revisions(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_platform_installations_customer ON platform_installations(customer_id,id);
      CREATE TABLE IF NOT EXISTS platform_installation_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, installation_id INTEGER NOT NULL, revision INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('DRAFT','VALIDATED','SENT','CONFIRMED','ACTIVE','SUPERSEDED','REJECTED')),
        snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)), checksum TEXT NOT NULL,
        reason TEXT, created_at TEXT NOT NULL, created_by TEXT NOT NULL,
        UNIQUE(installation_id,revision),
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_platform_installation_revisions_latest ON platform_installation_revisions(installation_id,revision DESC);
      CREATE TABLE IF NOT EXISTS platform_installation_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, installation_id INTEGER NOT NULL, revision_id INTEGER NOT NULL,
        device_identity TEXT NOT NULL, received_checksum TEXT NOT NULL,
        matched INTEGER NOT NULL CHECK(matched IN (0,1)), received_at TEXT NOT NULL,
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(revision_id) REFERENCES platform_installation_revisions(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS platform_installation_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, installation_id INTEGER NOT NULL, revision_id INTEGER NOT NULL,
        stage TEXT NOT NULL CHECK(stage IN ('TECHNICAL','CUSTOMER_ACCEPTANCE')),
        decision TEXT NOT NULL CHECK(decision IN ('ACCEPT','REJECT')),
        actor_identity TEXT NOT NULL, note TEXT, decided_at TEXT NOT NULL,
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(revision_id) REFERENCES platform_installation_revisions(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS platform_installation_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, installation_id INTEGER NOT NULL, revision_id INTEGER,
        event_type TEXT NOT NULL, actor_identity TEXT NOT NULL, occurred_at TEXT NOT NULL,
        evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
        FOREIGN KEY(installation_id) REFERENCES platform_installations(id) ON DELETE RESTRICT,
        FOREIGN KEY(revision_id) REFERENCES platform_installation_revisions(id) ON DELETE RESTRICT
      );
      CREATE TRIGGER IF NOT EXISTS trg_installation_revisions_content_immutable
      BEFORE UPDATE ON platform_installation_revisions
      WHEN NEW.installation_id<>OLD.installation_id OR NEW.revision<>OLD.revision
        OR NEW.snapshot_json<>OLD.snapshot_json OR NEW.checksum<>OLD.checksum
        OR COALESCE(NEW.reason,'')<>COALESCE(OLD.reason,'')
        OR NEW.created_at<>OLD.created_at OR NEW.created_by<>OLD.created_by
      BEGIN SELECT RAISE(ABORT,'installation revision content is immutable'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_revisions_no_delete BEFORE DELETE ON platform_installation_revisions BEGIN SELECT RAISE(ABORT,'installation revisions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_receipts_no_update BEFORE UPDATE ON platform_installation_receipts BEGIN SELECT RAISE(ABORT,'installation receipts are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_receipts_no_delete BEFORE DELETE ON platform_installation_receipts BEGIN SELECT RAISE(ABORT,'installation receipts are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_decisions_no_update BEFORE UPDATE ON platform_installation_decisions BEGIN SELECT RAISE(ABORT,'installation decisions are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_decisions_no_delete BEFORE DELETE ON platform_installation_decisions BEGIN SELECT RAISE(ABORT,'installation decisions are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_events_no_update BEFORE UPDATE ON platform_installation_events BEGIN SELECT RAISE(ABORT,'installation events are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS trg_installation_events_no_delete BEFORE DELETE ON platform_installation_events BEGIN SELECT RAISE(ABORT,'installation events are append-only'); END;
    `);
  },
};
