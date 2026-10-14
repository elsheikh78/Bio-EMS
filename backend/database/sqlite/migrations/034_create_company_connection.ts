import type { Migration } from "../migration-runner";

export const migration034: Migration = {
  version: 34,
  description: "Opt-in encrypted company cloud connection",
  up(db) {
    db.exec(`CREATE TABLE company_connection (
    singleton INTEGER PRIMARY KEY CHECK(singleton=1),
    encrypted_config TEXT NOT NULL
  );
  CREATE TABLE company_remote_receipts (
    command_id TEXT PRIMARY KEY,
    consumed_at INTEGER NOT NULL
  )`);
  },
};
