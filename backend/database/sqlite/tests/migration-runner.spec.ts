import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../migration-runner";
import { MigrationRepository } from "../migration.repository";

describe("SQLite migrations", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec(`
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY,
        alarm_low REAL,
        alarm_high REAL
      );
    `);
  });

  afterEach(() => database.close());

  it("records ordered migration history and adds warning thresholds", () => {
    runMigrations(database);

    const columns = database.prepare("PRAGMA table_info(sensors)").all() as Array<{
      name: string;
    }>;
    const history = new MigrationRepository(database).getAppliedVersions();

    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["warning_low", "warning_high"])
    );
    expect(history).toEqual([1, 2]);
  });

  it("is idempotent when the migration runner executes more than once", () => {
    runMigrations(database);
    runMigrations(database);

    const historyCount = database
      .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
      .get() as { count: number };
    const warningColumns = (
      database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>
    ).filter((column) => column.name.startsWith("warning_"));

    expect(historyCount.count).toBe(2);
    expect(warningColumns).toHaveLength(2);
  });
});
