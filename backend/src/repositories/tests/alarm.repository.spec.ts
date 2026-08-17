import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AlarmRepository } from "../alarm.repository";

describe("AlarmRepository", () => {
  let database: Database.Database;
  let repository: AlarmRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT
      );

      CREATE TABLE alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        trigger_value REAL NOT NULL,
        trigger_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged_time DATETIME,
        acknowledged_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recovered_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    repository = new AlarmRepository(database);
  });

  afterEach(() => database.close());

  it("persists and retrieves an active alarm without changing its contract", () => {
    const id = repository.create({
      sensor_id: 7,
      type: "HIGH_TEMPERATURE",
      severity: "CRITICAL",
      status: "TRIGGERED",
      trigger_value: 12,
    });

    expect(repository.findActiveAlarm(7, "HIGH_TEMPERATURE")).toMatchObject({
      id,
      sensor_id: 7,
      type: "HIGH_TEMPERATURE",
      severity: "CRITICAL",
      status: "TRIGGERED",
      trigger_value: 12,
    });
  });

  it("acknowledges a triggered alarm", () => {
    const userId = Number(
      database.prepare("INSERT INTO users DEFAULT VALUES").run().lastInsertRowid
    );
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    expect(repository.acknowledgeAlarm(id, userId)).toBe(true);

    expect(repository.getById(id)).toMatchObject({ status: "ACKNOWLEDGED" });
    expect(repository.getById(id)?.acknowledged_time).toBeTruthy();
    expect(
      database.prepare("SELECT acknowledged_by_user_id FROM alarms WHERE id = ?").get(id)
    ).toEqual({ acknowledged_by_user_id: userId });
    expect(repository.getById(id)).not.toHaveProperty("acknowledged_by_user_id");
  });

  it("preserves the first user and timestamp when acknowledgment is repeated", () => {
    const firstUserId = Number(
      database.prepare("INSERT INTO users DEFAULT VALUES").run().lastInsertRowid
    );
    const secondUserId = Number(
      database.prepare("INSERT INTO users DEFAULT VALUES").run().lastInsertRowid
    );
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    expect(repository.acknowledgeAlarm(id, firstUserId)).toBe(true);
    const firstAudit = database
      .prepare("SELECT acknowledged_time, acknowledged_by_user_id FROM alarms WHERE id = ?")
      .get(id);

    expect(repository.acknowledgeAlarm(id, secondUserId)).toBe(false);
    expect(
      database
        .prepare("SELECT acknowledged_time, acknowledged_by_user_id FROM alarms WHERE id = ?")
        .get(id)
    ).toEqual(firstAudit);
  });

  it("enforces the User foreign key and sets the audit identity to null on deletion", () => {
    const userId = Number(
      database.prepare("INSERT INTO users DEFAULT VALUES").run().lastInsertRowid
    );
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    expect(() => repository.acknowledgeAlarm(id, 999)).toThrow();
    expect(repository.acknowledgeAlarm(id, userId)).toBe(true);
    const acknowledgedTime = database
      .prepare("SELECT acknowledged_time FROM alarms WHERE id = ?")
      .pluck()
      .get(id);

    database.prepare("DELETE FROM users WHERE id = ?").run(userId);

    expect(
      database
        .prepare(
          "SELECT status, acknowledged_time, acknowledged_by_user_id FROM alarms WHERE id = ?"
        )
        .get(id)
    ).toEqual({
      status: "ACKNOWLEDGED",
      acknowledged_time: acknowledgedTime,
      acknowledged_by_user_id: null,
    });
  });

  it("keeps the audit column out of every Alarm read projection", () => {
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    expect(repository.findActiveAlarm(7, "LOW_TEMPERATURE")).not.toHaveProperty(
      "acknowledged_by_user_id"
    );
    expect(repository.getById(id)).not.toHaveProperty("acknowledged_by_user_id");
    expect(repository.getActive()[0]).not.toHaveProperty("acknowledged_by_user_id");
    expect(repository.getAll()[0]).not.toHaveProperty("acknowledged_by_user_id");
  });

  it("recovers a triggered alarm", () => {
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    expect(repository.recoverAlarm(id)).toBe(true);
    expect(repository.recoverAlarm(id)).toBe(false);

    expect(repository.getById(id)).toMatchObject({ status: "RECOVERED" });
    expect(repository.getById(id)?.recovered_time).toBeTruthy();
  });
});
