import type { Migration } from "../migration-runner";
export const migration035: Migration = {
  version: 35,
  description: "Company pilot license snapshot",
  up(db) {
    db.exec(
      `CREATE TABLE company_license_snapshot (singleton INTEGER PRIMARY KEY CHECK(singleton=1), site_id TEXT NOT NULL, synced_at TEXT NOT NULL, licenses_json TEXT NOT NULL)`
    );
  },
};
