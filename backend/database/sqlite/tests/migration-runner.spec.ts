import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../migration-runner";
import { MigrationRepository } from "../migration.repository";
import { createTables } from "../schema";
import { migration003 } from "../migrations/003_create_users";
import { migration004 } from "../migrations/004_add_alarm_acknowledging_user";
import { migration005 } from "../migrations/005_add_sensor_calibration_foundation";
import { migration006 } from "../migrations/006_create_calibration_records";
import { migration007 } from "../migrations/007_add_device_communication_health";
import { migration008 } from "../migrations/008_create_notification_events";
import { migration009 } from "../migrations/009_create_platform_principals";
import { migration010 } from "../migrations/010_create_audit_events";
import { migration011 } from "../migrations/011_add_alarm_delay_configuration";
import { migration012 } from "../migrations/012_create_notification_recipients";
import { migration013 } from "../migrations/013_create_escalation_policies";
import { migration014 } from "../migrations/014_create_device_communication_events";
import { migration015 } from "../migrations/015_create_notification_deliveries";
import { migration016 } from "../migrations/016_add_notification_attempt_phases";

const ALL_MIGRATION_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

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

      CREATE TABLE devices (
        id INTEGER PRIMARY KEY,
        device_id TEXT
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
    expect(history).toEqual(ALL_MIGRATION_VERSIONS);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toEqual({ name: "users" });
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'platform_principals'"
        )
        .get()
    ).toEqual({ name: "platform_principals" });
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'")
        .get()
    ).toEqual({ name: "audit_events" });
  });

  it("is idempotent when the migration runner executes more than once", () => {
    runMigrations(database);
    runMigrations(database);

    const historyCount = database
      .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
      .get() as { count: number };
    const warningColumns = (
      database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>
    ).filter((column) => ["warning_low", "warning_high"].includes(column.name));

    expect(historyCount.count).toBe(20);
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

  it("is idempotent when migration 005 executes directly more than once", () => {
    migration005.up(database);
    migration005.up(database);

    const lifecycleColumns = (
      database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>
    ).filter((column) =>
      [
        "product_grade",
        "hardware_model",
        "installation_date",
        "calibration_status",
        "last_calibrated_at",
        "calibration_due_at",
        "calibration_offset",
        "certificate_reference",
      ].includes(column.name)
    );

    expect(lifecycleColumns).toHaveLength(8);
  });

  it("is idempotent when migration 006 executes directly more than once", () => {
    migration003.up(database);
    migration006.up(database);
    migration006.up(database);

    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'calibration_records'"
        )
        .get()
    ).toEqual({ name: "calibration_records" });
    expect(database.prepare("PRAGMA index_list(calibration_records)").all()).toContainEqual(
      expect.objectContaining({ name: "idx_calibration_records_sensor_performed" })
    );
  });

  it("is idempotent when migration 007 executes directly more than once", () => {
    migration007.up(database);
    migration007.up(database);

    const columns = database.prepare("PRAGMA table_info(devices)").all() as Array<{ name: string }>;
    expect(columns.filter(({ name }) => name.startsWith("last_")).map(({ name }) => name)).toEqual([
      "last_seen_at",
      "last_heartbeat_at",
    ]);
  });

  it("is idempotent when migration 008 executes directly more than once", () => {
    migration008.up(database);
    migration008.up(database);

    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notification_events'"
        )
        .get()
    ).toEqual({ name: "notification_events" });
    expect(database.prepare("PRAGMA index_list(notification_events)").all()).toContainEqual(
      expect.objectContaining({ name: "idx_notification_events_pending" })
    );
  });

  it("is idempotent when migration 009 executes directly more than once", () => {
    migration009.up(database);
    migration009.up(database);

    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'platform_principals'"
        )
        .get()
    ).toEqual({ name: "platform_principals" });
    expect(database.prepare("PRAGMA index_list(platform_principals)").all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "idx_platform_principals_username", unique: 1 }),
        expect.objectContaining({
          name: "idx_platform_principals_system_owner_singleton",
          unique: 1,
        }),
      ])
    );
  });

  it("is idempotent when migration 010 executes directly more than once", () => {
    migration010.up(database);
    migration010.up(database);

    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'")
        .get()
    ).toEqual({ name: "audit_events" });
    expect(database.prepare("PRAGMA index_list(audit_events)").all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "idx_audit_events_site_order" }),
        expect.objectContaining({ name: "idx_audit_events_actor_order" }),
      ])
    );
  });

  it("is idempotent when migration 011 executes directly more than once", () => {
    migration011.up(database);
    migration011.up(database);

    const sensorColumns = database.prepare("PRAGMA table_info(sensors)").all() as Array<{
      name: string;
      dflt_value: string | null;
    }>;
    expect(sensorColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "warning_delay_seconds", dflt_value: "0" }),
        expect.objectContaining({ name: "critical_delay_seconds", dflt_value: "0" }),
      ])
    );
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'alarm_activation_candidates'"
        )
        .get()
    ).toEqual({ name: "alarm_activation_candidates" });
  });

  it("is idempotent when migration 012 executes directly more than once", () => {
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration012.up(database);
    migration012.up(database);

    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notification_recipients'"
        )
        .get()
    ).toEqual({ name: "notification_recipients" });
    expect(
      database.prepare("PRAGMA index_list(notification_recipient_endpoints)").all()
    ).toContainEqual(expect.objectContaining({ unique: 1 }));
  });

  it("is idempotent when migration 013 executes directly more than once", () => {
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    migration013.up(database);
    migration013.up(database);
    expect(database.prepare("PRAGMA index_list(escalation_policy_steps)").all()).toEqual(
      expect.arrayContaining([expect.objectContaining({ unique: 1 })])
    );
  });

  it("creates an idempotent append-only Device communication ledger", () => {
    migration014.up(database);
    migration014.up(database);
    database.prepare("INSERT INTO devices (id, device_id) VALUES (?, ?)").run(1, "ZC-FW-001");
    database
      .prepare(
        "INSERT INTO device_communication_events (device_id, event_type, observed_at) VALUES (?, ?, ?)"
      )
      .run(1, "TELEMETRY", "2026-08-31T10:00:00.000Z");

    expect(database.prepare("PRAGMA index_list(device_communication_events)").all()).toContainEqual(
      expect.objectContaining({ name: "idx_device_communication_events_device_time" })
    );
    expect(() =>
      database.prepare("UPDATE device_communication_events SET event_type = 'HEARTBEAT'").run()
    ).toThrow("device communication events are append-only");
    expect(() => database.prepare("DELETE FROM device_communication_events").run()).toThrow(
      "device communication events are append-only"
    );
  });

  it("creates idempotent delivery jobs and append-only attempt evidence", () => {
    migration015.up(database);
    migration015.up(database);
    migration016.up(database);
    migration016.up(database);

    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get("notification_deliveries")
    ).toBeTruthy();
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get("notification_delivery_attempts")
    ).toBeTruthy();
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
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual(ALL_MIGRATION_VERSIONS);

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
    database.prepare("INSERT INTO devices (id, device_id) VALUES (3, 'ZC-FW-001')").run();
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
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual(ALL_MIGRATION_VERSIONS);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
        .get()
    ).toEqual({ name: "users" });
    expect(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'platform_principals'"
        )
        .get()
    ).toEqual({ name: "platform_principals" });
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
    expect(
      database
        .prepare("SELECT id, device_id, last_seen_at, last_heartbeat_at FROM devices WHERE id = 3")
        .get()
    ).toEqual({
      id: 3,
      device_id: "ZC-FW-001",
      last_seen_at: null,
      last_heartbeat_at: null,
    });
    expect(
      database
        .prepare(
          "SELECT product_grade, calibration_status, calibration_offset FROM sensors WHERE id = 1"
        )
        .get()
    ).toEqual({
      product_grade: "STANDARD",
      calibration_status: "NOT_CALIBRATED",
      calibration_offset: 0,
    });
    expect(new MigrationRepository(database).getAppliedVersions()).toEqual(ALL_MIGRATION_VERSIONS);
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
        CREATE TABLE devices (id INTEGER PRIMARY KEY);
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
