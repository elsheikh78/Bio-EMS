import type Database from "better-sqlite3";

export const migration036 = {
  version: 36,
  description: "Owner feature policies, controller health and durable ingress receipts",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE feature_policies (
        scope TEXT PRIMARY KEY, revision INTEGER NOT NULL,
        policy_json TEXT NOT NULL CHECK(json_valid(policy_json)),
        updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
      );
      CREATE TABLE feature_policy_history (
        id INTEGER PRIMARY KEY, scope TEXT NOT NULL, revision INTEGER NOT NULL,
        previous_json TEXT NOT NULL, policy_json TEXT NOT NULL,
        reason TEXT NOT NULL, actor TEXT NOT NULL, occurred_at TEXT NOT NULL,
        UNIQUE(scope, revision)
      );
      CREATE TABLE controller_health (
        binding_id TEXT PRIMARY KEY REFERENCES device_platform_bindings(platform_binding_id),
        applied_revision INTEGER NOT NULL DEFAULT 0,
        health_json TEXT NOT NULL CHECK(json_valid(health_json)), received_at TEXT NOT NULL
      );
      CREATE TABLE controller_health_alarms (
        id INTEGER PRIMARY KEY, binding_id TEXT NOT NULL,
        code TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('TRIGGERED','ACKNOWLEDGED','RECOVERED')),
        severity TEXT NOT NULL DEFAULT 'CRITICAL', trigger_time TEXT NOT NULL,
        acknowledged_at TEXT, acknowledged_by TEXT, recovered_at TEXT,
        UNIQUE(binding_id, code, trigger_time)
      );
      CREATE UNIQUE INDEX controller_health_one_open ON controller_health_alarms(binding_id, code)
        WHERE status != 'RECOVERED';
      CREATE TABLE controller_ingress_receipts (
        binding_id TEXT NOT NULL, sample_id TEXT NOT NULL, payload_hash TEXT NOT NULL,
        accepted_at TEXT NOT NULL, PRIMARY KEY(binding_id, sample_id)
      );
    `);
  },
};
