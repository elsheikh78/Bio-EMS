import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../migration-runner";
import { MigrationRepository } from "../migration.repository";
import { createTables } from "../schema";
import { migration003 } from "../migrations/003_create_users";
import { migration004 } from "../migrations/004_add_alarm_acknowledging_user";

function getUserSchema(database: Database.Database) {
  return {
    columns: database.prepare("PRAGMA table_info(users)").all(),
    indexes: database.prepare("PRAGMA index_list(users)").all(),
    indexColumns: database.prepare("PRAGMA index_info(idx_users_username)").all(),
    sql: String(
      database
        .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .pluck()
        .get()
    )
      .replace(/\s+/g, " ")
      .trim(),
  };
}

describe("SQLite migrations", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY,
        alarm_low REAL,
        alarm_high REAL
      );

      CREATE TABLE alarms (
        id INTEGER PRIMARY KEY,
        legacy_value TEXT
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
    expect(history).toEqual([1, 2, 3, 4]);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toEqual({ name: "users" });
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

    expect(historyCount.count).toBe(4);
    expect(warningColumns).toHaveLength(2);
  });

  it("is idempotent when migration 003 executes directly more than once", () => {
    migration003.up(database);
    migration003.up(database);

    expect(database.prepare("PRAGMA index_list(users)").all()).toContainEqual(
      expect.objectContaining({ name: "idx_users_username", unique: 1 })
    );
  });

  it("is idempotent when migration 004 executes directly more than once", () => {
    migration003.up(database);
    migration004.up(database);
    migration004.up(database);

    const auditColumns = (
      database.prepare("PRAGMA table_info(alarms)").all() as Array<{ name: string }>
    ).filter((column) => column.name === "acknowledged_by_user_id");

    expect(auditColumns).toHaveLength(1);
  });

  it("creates the approved User schema and username index on a fresh application database", () => {
    database.exec("DROP TABLE alarms; DROP TABLE sensors");
    createTables(database);
    runMigrations(database);

    const columns = database.prepare("PRAGMA table_info(users)").all() as Array<{
      name: string;
      notnull: number;
      dflt_value: string | null;
    }>;
    const indexes = database.prepare("PRAGMA index_list(users)").all() as Array<{
      name: string;
      unique: number;
    }>;

    expect(columns.map((column) => column.name)).toEqual([
      "id",
      "username",
      "email",
      "password_hash",
      "role",
      "status",
      "created_at",
      "updated_at",
    ]);
    expect(columns.find((column) => column.name === "status")?.dflt_value).toBe("'active'");
    expect(indexes).toContainEqual(
      expect.objectContaining({ name: "idx_users_username", unique: 1 })
    );
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual([1, 2, 3, 4]);

    const alarmColumn = (
      database.prepare("PRAGMA table_info(alarms)").all() as Array<{
        name: string;
        type: string;
        notnull: number;
      }>
    ).find((column) => column.name === "acknowledged_by_user_id");
    const alarmForeignKey = (
      database.prepare("PRAGMA foreign_key_list(alarms)").all() as Array<{
        table: string;
        from: string;
        to: string;
        on_delete: string;
      }>
    ).find((foreignKey) => foreignKey.from === "acknowledged_by_user_id");

    expect(alarmColumn).toMatchObject({ type: "INTEGER", notnull: 0 });
    expect(alarmForeignKey).toMatchObject({
      table: "users",
      from: "acknowledged_by_user_id",
      to: "id",
      on_delete: "SET NULL",
    });

    database
      .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)")
      .run("fresh-user", "hash", "VIEWER");
    expect(database.prepare("SELECT status, created_at, updated_at FROM users").get()).toEqual({
      status: "active",
      created_at: expect.any(String),
      updated_at: null,
    });
  });

  it("upgrades a pre-Sprint 13 database without changing existing data", () => {
    database.prepare("INSERT INTO sensors (id, alarm_low, alarm_high) VALUES (1, 2.5, 8.5)").run();
    database.prepare("INSERT INTO alarms (id, legacy_value) VALUES (8, 'preserved')").run();
    runMigrations(database, [
      {
        version: 1,
        description: "Initial database schema",
        up() {},
      },
      {
        version: 2,
        description: "Add warning thresholds to sensors table",
        up(db) {
          db.exec("ALTER TABLE sensors ADD COLUMN warning_low REAL");
          db.exec("ALTER TABLE sensors ADD COLUMN warning_high REAL");
        },
      },
    ]);

    runMigrations(database);

    expect(database.prepare("SELECT id, alarm_low, alarm_high FROM sensors").get()).toEqual({
      id: 1,
      alarm_low: 2.5,
      alarm_high: 8.5,
    });
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual([1, 2, 3, 4]);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toEqual({ name: "users" });
    database
      .prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)")
      .run("upgrade-user", "hash", "VIEWER");
    expect(database.prepare("SELECT status, created_at, updated_at FROM users").get()).toEqual({
      status: "active",
      created_at: expect.any(String),
      updated_at: null,
    });
    expect(
      database
        .prepare("SELECT id, legacy_value, acknowledged_by_user_id FROM alarms WHERE id = 8")
        .get()
    ).toEqual({ id: 8, legacy_value: "preserved", acknowledged_by_user_id: null });
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual([1, 2, 3, 4]);
  });

  it("keeps the User schema identical between fresh and supported upgrade paths", () => {
    const freshDatabase = new Database(":memory:");
    const upgradeDatabase = new Database(":memory:");

    try {
      createTables(freshDatabase);
      runMigrations(freshDatabase);
      upgradeDatabase.exec(`
        CREATE TABLE sensors (id INTEGER PRIMARY KEY);
        CREATE TABLE alarms (id INTEGER PRIMARY KEY);
      `);
      runMigrations(upgradeDatabase);

      expect(getUserSchema(freshDatabase)).toEqual(getUserSchema(upgradeDatabase));
    } finally {
      freshDatabase.close();
      upgradeDatabase.close();
    }
  });

  it("rolls back migration 003 and does not record it when index creation fails", () => {
    database.exec("CREATE TABLE idx_users_username (id INTEGER PRIMARY KEY)");

    expect(() => runMigrations(database)).toThrow();

    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toBeUndefined();
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual([1, 2]);
  });

  it("does not record migration 004 when its schema change fails", () => {
    database.exec("DROP TABLE alarms; CREATE VIEW alarms AS SELECT 1 AS id");

    expect(() => runMigrations(database)).toThrow();

    expect(new MigrationRepository(database).getAppliedVersions()).toEqual([1, 2, 3]);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'view' AND name = 'alarms'")
        .get()
    ).toEqual({ name: "alarms" });
  });
});
