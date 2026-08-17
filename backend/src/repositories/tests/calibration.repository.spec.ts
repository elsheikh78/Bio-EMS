import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration006 } from "../../../database/sqlite/migrations/006_create_calibration_records";
import { CalibrationRepository } from "../calibration.repository";

const sensorUuid = "8ae946c2-1424-44e8-b98d-ae2fd2f2273e";

describe("CalibrationRepository", () => {
  let database: Database.Database;
  let repository: CalibrationRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        calibration_status TEXT NOT NULL DEFAULT 'NOT_CALIBRATED',
        last_calibrated_at TEXT,
        calibration_due_at TEXT,
        calibration_offset REAL NOT NULL DEFAULT 0,
        certificate_reference TEXT,
        updated_at TEXT
      );
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL
      );
      INSERT INTO sensors (id, uuid) VALUES (4, '${sensorUuid}');
      INSERT INTO users (id, username) VALUES (7, 'calibration-admin');
    `);
    migration006.up(database);
    repository = new CalibrationRepository(database);
  });

  afterEach(() => database.close());

  it("atomically records a passing calibration and updates the current Sensor snapshot", () => {
    const record = repository.create(
      sensorUuid,
      {
        result: "PASS",
        performed_at: "2026-08-17T09:00:00Z",
        due_at: "2027-08-17T09:00:00Z",
        offset: -0.15,
        certificate_reference: "CAL-2026-0042",
        notes: "Within tolerance",
      },
      7
    );

    expect(record).toMatchObject({
      sensor_uuid: sensorUuid,
      result: "PASS",
      performed_by_user_id: 7,
      performed_by_username: "calibration-admin",
    });
    expect(database.prepare("SELECT * FROM calibration_records").all()).toHaveLength(1);
    expect(
      database
        .prepare(
          `SELECT calibration_status, last_calibrated_at, calibration_due_at,
                  calibration_offset, certificate_reference
           FROM sensors WHERE id = 4`
        )
        .get()
    ).toEqual({
      calibration_status: "VALID",
      last_calibrated_at: "2026-08-17T09:00:00Z",
      calibration_due_at: "2027-08-17T09:00:00Z",
      calibration_offset: -0.15,
      certificate_reference: "CAL-2026-0042",
    });
  });

  it("preserves a valid current snapshot when a later calibration attempt fails", () => {
    repository.create(
      sensorUuid,
      {
        result: "PASS",
        performed_at: "2026-08-17T09:00:00Z",
        due_at: "2027-08-17T09:00:00Z",
        offset: -0.15,
      },
      7
    );

    repository.create(
      sensorUuid,
      {
        result: "FAIL",
        performed_at: "2026-09-01T09:00:00Z",
        notes: "Out of tolerance",
      },
      7
    );

    expect(repository.listBySensorUuid(sensorUuid)?.map((record) => record.result)).toEqual([
      "FAIL",
      "PASS",
    ]);
    expect(
      database
        .prepare("SELECT calibration_status, last_calibrated_at FROM sensors WHERE id = 4")
        .get()
    ).toEqual({
      calibration_status: "VALID",
      last_calibrated_at: "2026-08-17T09:00:00Z",
    });
  });

  it("returns undefined without writing for an unknown Sensor UUID", () => {
    expect(
      repository.create(
        "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
        { result: "FAIL", performed_at: "2026-08-17T09:00:00Z" },
        7
      )
    ).toBeUndefined();
    expect(database.prepare("SELECT * FROM calibration_records").all()).toEqual([]);
  });

  it("rolls back both record and Sensor update when actor persistence fails", () => {
    expect(() =>
      repository.create(
        sensorUuid,
        {
          result: "PASS",
          performed_at: "2026-08-17T09:00:00Z",
          due_at: "2027-08-17T09:00:00Z",
          offset: 0.2,
        },
        999
      )
    ).toThrow();

    expect(database.prepare("SELECT * FROM calibration_records").all()).toEqual([]);
    expect(
      database
        .prepare("SELECT calibration_status, calibration_offset FROM sensors WHERE id = 4")
        .get()
    ).toEqual({ calibration_status: "NOT_CALIBRATED", calibration_offset: 0 });
  });

  it("rejects update and delete attempts at the SQLite boundary", () => {
    const record = repository.create(
      sensorUuid,
      { result: "FAIL", performed_at: "2026-08-17T09:00:00Z" },
      7
    );

    expect(() =>
      database
        .prepare("UPDATE calibration_records SET notes = ? WHERE id = ?")
        .run("changed", record!.id)
    ).toThrow(/immutable/);
    expect(() =>
      database.prepare("DELETE FROM calibration_records WHERE id = ?").run(record!.id)
    ).toThrow(/immutable/);
    expect(database.prepare("SELECT COUNT(*) AS count FROM calibration_records").get()).toEqual({
      count: 1,
    });
  });
});
