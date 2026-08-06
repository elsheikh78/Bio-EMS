import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AlarmRepository } from "../alarm.repository";

describe("AlarmRepository", () => {
  let database: Database.Database;
  let repository: AlarmRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec(`
      CREATE TABLE alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        trigger_value REAL NOT NULL,
        trigger_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged_time DATETIME,
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
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    repository.acknowledgeAlarm(id);

    expect(repository.getById(id)).toMatchObject({ status: "ACKNOWLEDGED" });
    expect(repository.getById(id)?.acknowledged_time).toBeTruthy();
  });

  it("recovers a triggered alarm", () => {
    const id = repository.create({
      sensor_id: 7,
      type: "LOW_TEMPERATURE",
      severity: "WARNING",
      status: "TRIGGERED",
      trigger_value: 1,
    });

    repository.recoverAlarm(id);

    expect(repository.getById(id)).toMatchObject({ status: "RECOVERED" });
    expect(repository.getById(id)?.recovered_time).toBeTruthy();
  });
});
