import type Database from "better-sqlite3";

export const migration025 = {
  version: 25,
  description: "Create immutable System Owner commissioning receipts",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS owner_commissioning_receipts (
        commissioning_id TEXT PRIMARY KEY,
        installation_id TEXT NOT NULL,
        signing_key_id TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_commissioning_installation
        ON owner_commissioning_receipts(installation_id);

      CREATE TRIGGER IF NOT EXISTS trg_owner_commissioning_receipts_no_update
      BEFORE UPDATE ON owner_commissioning_receipts
      BEGIN
        SELECT RAISE(ABORT, 'owner commissioning receipts are immutable');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_owner_commissioning_receipts_no_delete
      BEFORE DELETE ON owner_commissioning_receipts
      BEGIN
        SELECT RAISE(ABORT, 'owner commissioning receipts are immutable');
      END;
    `);
  },
};
