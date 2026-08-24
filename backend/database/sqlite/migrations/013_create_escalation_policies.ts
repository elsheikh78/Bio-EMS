import type Database from "better-sqlite3";

export const migration013 = {
  version: 13,
  description: "Create Site-scoped notification escalation policies",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS escalation_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        site_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        owner_role TEXT NOT NULL CHECK(owner_role IN ('PRIMARY_CONTACT','QUALITY','ENGINEERING','SECURITY','MANAGEMENT','OTHER')),
        eligible_severities_json TEXT NOT NULL CHECK(json_valid(eligible_severities_json)),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_escalation_policies_site ON escalation_policies(site_id, status);
      CREATE TABLE IF NOT EXISTS escalation_policy_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_id INTEGER NOT NULL,
        position INTEGER NOT NULL CHECK(position > 0),
        delay_seconds INTEGER NOT NULL CHECK(delay_seconds BETWEEN 0 AND 604800),
        recipient_role TEXT NOT NULL CHECK(recipient_role IN ('PRIMARY_CONTACT','QUALITY','ENGINEERING','SECURITY','MANAGEMENT','OTHER')),
        channels_json TEXT NOT NULL CHECK(json_valid(channels_json)),
        FOREIGN KEY (policy_id) REFERENCES escalation_policies(id) ON DELETE CASCADE,
        UNIQUE(policy_id, position), UNIQUE(policy_id, delay_seconds)
      );
    `);
  },
};
