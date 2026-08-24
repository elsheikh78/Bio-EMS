import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { AuditActorSnapshot } from "../../entities/AuditEvent";
import { AuditEventRepository } from "../../repositories/audit-event.repository";
import { SensorRepository } from "../../repositories/sensor.repository";
import { AuditEventService } from "../audit-event.service";
import { SensorThresholdService } from "../sensor-threshold.service";

const actor: AuditActorSnapshot = {
  kind: "CUSTOMER_USER",
  id: "1",
  username: "admin",
  role: "ADMIN",
};
const requestContext = { source: "SENSOR_CONFIGURATION_API" } as const;
const sensorUuid = "8ae946c2-1424-44e8-b98d-ae2fd2f2273e";

describe("Sensor threshold service", () => {
  let database: Database.Database;
  let repository: SensorRepository;
  let auditRepository: AuditEventRepository;
  let service: SensorThresholdService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY);
      CREATE TABLE rooms (id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL);
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        room_id INTEGER NOT NULL,
        device_id INTEGER NOT NULL,
        channel INTEGER NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        sensor_type TEXT NOT NULL,
        unit TEXT NOT NULL,
        min_value REAL,
        max_value REAL,
        warning_low REAL,
        alarm_low REAL,
        warning_high REAL,
        alarm_high REAL,
        updated_at TEXT
      );
      INSERT INTO sites (id) VALUES (7);
      INSERT INTO rooms (id, site_id) VALUES (3, 7);
      INSERT INTO sensors (
        id, uuid, room_id, device_id, channel, code, name, sensor_type, unit,
        min_value, max_value, warning_low, alarm_low, warning_high, alarm_high
      ) VALUES (
        9, '${sensorUuid}', 3, 2, 1, 'TEMP-01', 'Temperature', 'TEMPERATURE', '°C',
        -20, 20, 3, 1, 8, 10
      );
    `);
    migration010.up(database);
    repository = new SensorRepository(database);
    auditRepository = new AuditEventRepository(database);
    const auditService = new AuditEventService({ repository: auditRepository });
    service = new SensorThresholdService({
      repository,
      auditService,
      runInTransaction: (operation) => database.transaction(operation)(),
    });
  });

  afterEach(() => database.close());

  it("merges a partial update and writes Site-scoped prior/new audit evidence", () => {
    const updated = service.updateThresholds(
      actor,
      sensorUuid,
      { warning_low: 4, alarm_high: 12 },
      requestContext
    );

    expect(updated).toMatchObject({
      warning_low: 4,
      alarm_low: 1,
      warning_high: 8,
      alarm_high: 12,
    });
    expect(auditRepository.list({ siteId: 7, limit: 10 })[0]).toMatchObject({
      actor,
      action: "SENSOR.THRESHOLDS_UPDATED",
      target: { type: "SENSOR", id: sensorUuid },
      siteId: 7,
      result: "SUCCESS",
      previousValues: { warning_low: 3, alarm_low: 1, warning_high: 8, alarm_high: 10 },
      newValues: { warning_low: 4, alarm_low: 1, warning_high: 8, alarm_high: 12 },
    });
  });

  it("supports explicit clearing and successful no-op evidence", () => {
    expect(
      service.updateThresholds(actor, sensorUuid, { warning_low: null }, requestContext)
    ).toMatchObject({ warning_low: null });

    expect(
      service.updateThresholds(actor, sensorUuid, { warning_high: 8 }, requestContext)
    ).toMatchObject({ warning_high: 8 });
    expect(auditRepository.list({ siteId: 7, limit: 10 })).toHaveLength(2);
  });

  it.each([
    ["non-increasing order", { warning_low: 0 }],
    ["below measurement range", { alarm_low: -21 }],
    ["above measurement range", { alarm_high: 21 }],
  ] as const)("rejects %s without changing effective thresholds", (_case, input) => {
    expect(() => service.updateThresholds(actor, sensorUuid, input, requestContext)).toThrowError(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );
    expect(repository.findThresholdContextByUuid(sensorUuid)?.sensor).toMatchObject({
      warning_low: 3,
      alarm_low: 1,
      warning_high: 8,
      alarm_high: 10,
    });
    expect(auditRepository.list({ siteId: 7, limit: 10 })[0]).toMatchObject({
      result: "FAILED",
      reason: "VALIDATION_ERROR",
    });
  });

  it("records a safe unscoped failure for a missing Sensor", () => {
    const missing = "6efbc6de-6f5d-4fa4-bfa8-b52d3fd5a200";
    expect(() =>
      service.updateThresholds(actor, missing, { warning_low: 3 }, requestContext)
    ).toThrowError(expect.objectContaining({ code: "SENSOR_NOT_FOUND" }));
    expect(auditRepository.list({ limit: 10 })[0]).toMatchObject({
      target: { type: "SENSOR", id: missing },
      siteId: undefined,
      result: "FAILED",
      reason: "SENSOR_NOT_FOUND",
    });
  });

  it("rolls back threshold persistence when SUCCESS audit insertion fails", () => {
    database.exec(`
      CREATE TRIGGER bf04_test_block_audit_insert
      BEFORE INSERT ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'blocked audit insert');
      END;
    `);

    expect(() =>
      service.updateThresholds(actor, sensorUuid, { warning_low: 4 }, requestContext)
    ).toThrow("blocked audit insert");
    expect(repository.findThresholdContextByUuid(sensorUuid)?.sensor.warning_low).toBe(3);
  });
});
