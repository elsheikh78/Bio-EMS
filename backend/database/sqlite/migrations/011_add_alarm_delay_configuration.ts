import type Database from "better-sqlite3";

export const migration011 = {
  version: 11,
  description: "Add Sensor Alarm delay configuration and activation candidates",
  up(database: Database.Database): void {
    const columns = database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>;
    const names = new Set(columns.map(({ name }) => name));

    if (!names.has("warning_delay_seconds")) {
      database.exec(
        "ALTER TABLE sensors ADD COLUMN warning_delay_seconds INTEGER NOT NULL DEFAULT 0 CHECK(warning_delay_seconds BETWEEN 0 AND 86400)"
      );
    }
    if (!names.has("critical_delay_seconds")) {
      database.exec(
        "ALTER TABLE sensors ADD COLUMN critical_delay_seconds INTEGER NOT NULL DEFAULT 0 CHECK(critical_delay_seconds BETWEEN 0 AND 86400)"
      );
    }

    database.exec(`
      CREATE TABLE IF NOT EXISTS alarm_activation_candidates (
        sensor_id INTEGER PRIMARY KEY,
        alarm_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('WARNING', 'CRITICAL')),
        first_observed_at TEXT NOT NULL,
        last_observed_at TEXT NOT NULL,
        latest_value REAL NOT NULL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
      );
    `);
  },
};
