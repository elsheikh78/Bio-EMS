import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { AuditActorSnapshot } from "../../entities/AuditEvent";
import { AlarmActivationCandidateRepository } from "../../repositories/alarm-activation-candidate.repository";
import { AuditEventRepository } from "../../repositories/audit-event.repository";
import { SensorRepository } from "../../repositories/sensor.repository";
import { AuditEventService } from "../audit-event.service";
import { SensorAlarmDelayService } from "../sensor-alarm-delay.service";

const actor: AuditActorSnapshot = {
  kind: "CUSTOMER_USER",
  id: "1",
  username: "admin",
  role: "ADMIN",
};
const requestContext = { source: "SENSOR_CONFIGURATION_API" } as const;
const sensorUuid = "8ae946c2-1424-44e8-b98d-ae2fd2f2273e";

describe("Sensor Alarm delay service", () => {
  let database: Database.Database;
  let repository: SensorRepository;
  let candidates: AlarmActivationCandidateRepository;
  let auditRepository: AuditEventRepository;
  let service: SensorAlarmDelayService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY);
      CREATE TABLE rooms (id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL);
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY, uuid TEXT NOT NULL UNIQUE, room_id INTEGER NOT NULL,
        warning_delay_seconds INTEGER NOT NULL DEFAULT 0,
        critical_delay_seconds INTEGER NOT NULL DEFAULT 0, updated_at TEXT
      );
      CREATE TABLE alarm_activation_candidates (
        sensor_id INTEGER PRIMARY KEY, alarm_type TEXT NOT NULL, severity TEXT NOT NULL,
        first_observed_at TEXT NOT NULL, last_observed_at TEXT NOT NULL, latest_value REAL NOT NULL
      );
      INSERT INTO sites (id) VALUES (7);
      INSERT INTO rooms (id, site_id) VALUES (3, 7);
      INSERT INTO sensors (id, uuid, room_id, warning_delay_seconds, critical_delay_seconds)
      VALUES (9, '${sensorUuid}', 3, 5, 2);
      INSERT INTO alarm_activation_candidates VALUES
      (9, 'HIGH_TEMPERATURE', 'WARNING', '2026-08-24T10:00:00Z', '2026-08-24T10:00:01Z', 9);
    `);
    migration010.up(database);
    repository = new SensorRepository(database);
    candidates = new AlarmActivationCandidateRepository(database);
    auditRepository = new AuditEventRepository(database);
    service = new SensorAlarmDelayService({
      repository,
      candidates,
      auditService: new AuditEventService({ repository: auditRepository }),
      runInTransaction: (operation) => database.transaction(operation)(),
    });
  });

  afterEach(() => database.close());

  it("merges partial values, invalidates pending state, and records Site-scoped evidence", () => {
    expect(
      service.update(actor, sensorUuid, { warning_delay_seconds: 30 }, requestContext)
    ).toMatchObject({ warning_delay_seconds: 30, critical_delay_seconds: 2 });
    expect(candidates.find(9)).toBeUndefined();
    expect(auditRepository.list({ siteId: 7, limit: 10 })[0]).toMatchObject({
      action: "SENSOR.ALARM_DELAY_UPDATED",
      result: "SUCCESS",
      previousValues: { warning_delay_seconds: 5, critical_delay_seconds: 2 },
      newValues: { warning_delay_seconds: 30, critical_delay_seconds: 2 },
    });
  });

  it("records a safe failure for a missing Sensor", () => {
    const missing = "6efbc6de-6f5d-4fa4-bfa8-b52d3fd5a200";
    expect(() =>
      service.update(actor, missing, { warning_delay_seconds: 1 }, requestContext)
    ).toThrowError(expect.objectContaining({ code: "SENSOR_NOT_FOUND" }));
    expect(auditRepository.list({ limit: 10 })[0]).toMatchObject({
      target: { type: "SENSOR", id: missing },
      result: "FAILED",
      reason: "SENSOR_NOT_FOUND",
    });
  });

  it("rolls back configuration and candidate invalidation when audit insertion fails", () => {
    database.exec(`
      CREATE TRIGGER bf05_block_audit BEFORE INSERT ON audit_events
      BEGIN SELECT RAISE(ABORT, 'blocked audit insert'); END;
    `);
    expect(() =>
      service.update(actor, sensorUuid, { critical_delay_seconds: 10 }, requestContext)
    ).toThrow();
    expect(repository.findThresholdContextByUuid(sensorUuid)?.sensor).toMatchObject({
      warning_delay_seconds: 5,
      critical_delay_seconds: 2,
    });
    expect(candidates.find(9)).toBeDefined();
  });
});
