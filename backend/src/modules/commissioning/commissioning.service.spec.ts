import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration017 } from "../../../database/sqlite/migrations/017_create_commissioning_evidence";
import { CommissioningRepository } from "./commissioning.repository";
import { CommissioningService } from "./commissioning.service";

describe("CommissioningService", () => {
  let database: Database.Database;
  let repository: CommissioningRepository;
  let service: CommissioningService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY);
      CREATE TABLE devices (
        id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL, device_id TEXT NOT NULL,
        activated INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE rooms (id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL, code TEXT NOT NULL);
      CREATE TABLE sensors (
        id INTEGER PRIMARY KEY, uuid TEXT NOT NULL, code TEXT NOT NULL, room_id INTEGER NOT NULL,
        device_id INTEGER NOT NULL, channel INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
        calibration_status TEXT NOT NULL DEFAULT 'NOT_CALIBRATED', calibration_due_at TEXT,
        certificate_reference TEXT
      );
      INSERT INTO sites (id) VALUES (1), (2);
    `);
    migration017.up(database);
    repository = new CommissioningRepository(database);
    service = new CommissioningService(repository);
  });

  afterEach(() => database.close());

  it("blocks acceptance while a mandatory check has not run", () => {
    const sessionId = createSession(1, "commissioning-blocked");
    repository.addCheck({
      sessionId,
      checkKey: "COMMUNICATION",
      title: "Communication verification",
      mandatory: true,
      physicalOrLiveGate: false,
    });

    expect(() =>
      service.appendDecision({
        siteId: 1,
        sessionId,
        decision: "ACCEPTED",
        decidedAt: "2026-09-01T11:00:00.000Z",
        actorIdentity: "operator#7",
      })
    ).toThrow("Commissioning acceptance blocked");
  });

  it("blocks automated evidence from satisfying a physical or live gate", () => {
    const sessionId = createSession(1, "commissioning-automated-only");
    const checkId = repository.addCheck({
      sessionId,
      checkKey: "SMS_FAILOVER",
      title: "SMS failover verification",
      mandatory: true,
      physicalOrLiveGate: true,
    });
    repository.appendEvidence({
      sessionId,
      checkId,
      state: "PASS",
      evidenceKind: "SOFTWARE_AUTOMATED",
      executedAt: "2026-09-01T10:58:00.000Z",
      actorIdentity: "operator#7",
    });

    expect(() =>
      service.appendDecision({
        siteId: 1,
        sessionId,
        decision: "ACCEPTED",
        decidedAt: "2026-09-01T11:00:00.000Z",
        actorIdentity: "operator#7",
      })
    ).toThrow("Commissioning acceptance blocked");
  });

  it("persists a server-generated acceptance snapshot after required evidence passes", () => {
    const sessionId = createSession(1, "commissioning-accepted");
    const checkId = repository.addCheck({
      sessionId,
      checkKey: "COMMUNICATION",
      title: "Communication verification",
      mandatory: true,
      physicalOrLiveGate: true,
    });
    repository.appendEvidence({
      sessionId,
      checkId,
      state: "PASS",
      evidenceKind: "PHYSICAL",
      executedAt: "2026-09-01T10:58:00.000Z",
      actorIdentity: "operator#7",
      evidenceReference: "EV-PHYSICAL-001",
    });

    const decisionId = service.appendDecision({
      siteId: 1,
      sessionId,
      decision: "ACCEPTED",
      decidedAt: "2026-09-01T11:00:00.000Z",
      actorIdentity: "operator#7",
    });

    const row = database
      .prepare("SELECT decision, snapshot_json FROM commissioning_decisions WHERE id = ?")
      .get(decisionId) as { decision: string; snapshot_json: string };
    const snapshot = JSON.parse(row.snapshot_json) as {
      evaluation: { acceptable: boolean; blockingReasons: string[] };
    };

    expect(row.decision).toBe("ACCEPTED");
    expect(snapshot.evaluation).toEqual({ acceptable: true, blockingReasons: [] });
  });

  it("rejects cross-site decision access", () => {
    const sessionId = createSession(1, "commissioning-site-scope");

    expect(() =>
      service.appendDecision({
        siteId: 2,
        sessionId,
        decision: "REJECTED",
        decidedAt: "2026-09-01T11:00:00.000Z",
        actorIdentity: "operator#7",
      })
    ).toThrow("Commissioning session not found");
  });

  it("rejects a sensor or device outside the session Site", () => {
    database.exec(`
      INSERT INTO devices (id, site_id, device_id, activated) VALUES (20, 2, 'OTHER-DEVICE', 1);
      INSERT INTO rooms (id, site_id, code) VALUES (20, 2, 'OTHER-ROOM');
      INSERT INTO sensors (id, uuid, code, room_id, device_id, channel)
      VALUES (20, 'other-sensor', 'OTHER-SENSOR', 20, 20, 1);
    `);
    const sessionId = createSession(1, "commissioning-scope-check");

    expect(() =>
      service.addCheck(1, {
        sessionId,
        checkKey: "MAPPING",
        title: "Mapping verification",
        mandatory: true,
        physicalOrLiveGate: true,
        sensorId: 20,
        deviceId: 20,
      })
    ).toThrow("Commissioning device not found");
  });

  it("summarizes configuration and calibration blockers from authoritative records", () => {
    database.exec(`
      INSERT INTO devices (id, site_id, device_id, activated) VALUES (10, 1, 'BIO-CTRL-01', 1);
      INSERT INTO rooms (id, site_id, code) VALUES (10, 1, 'CR-01');
      INSERT INTO sensors (
        id, uuid, code, room_id, device_id, channel, enabled, calibration_status,
        calibration_due_at, certificate_reference
      ) VALUES
        (10, 'sensor-ready', 'TEMP-01', 10, 10, 1, 1, 'VALID', '2027-01-01T00:00:00.000Z', 'CAL-001'),
        (11, 'sensor-blocked', 'TEMP-02', 10, 10, 2, 1, 'EXPIRED', '2026-01-01T00:00:00.000Z', NULL);
    `);

    expect(service.getConfigurationReadiness(1, "2026-09-01T12:00:00.000Z")).toMatchObject({
      ready: false,
      summary: { totalSensors: 2, readySensors: 1, blockedSensors: 1 },
      items: [
        { sensorCode: "TEMP-01", ready: true, blockers: [] },
        {
          sensorCode: "TEMP-02",
          ready: false,
          blockers: [
            "CALIBRATION_NOT_VALID",
            "CALIBRATION_CERTIFICATE_MISSING",
            "CALIBRATION_EXPIRED_OR_DUE",
          ],
        },
      ],
    });
  });

  it("initializes the controlled functional checklist idempotently", () => {
    const sessionId = createSession(1, "commissioning-functional-checks");
    const first = service.initializeFunctionalChecks(1, sessionId);
    const second = service.initializeFunctionalChecks(1, sessionId);

    expect(first.ids).toHaveLength(8);
    expect(second.ids).toEqual(first.ids);
    const record = service.getSessionRecord(1, sessionId);
    expect(record.evaluation.acceptable).toBe(false);
    expect(record.checks).toHaveLength(8);
    expect(record.checks.slice(0, 2)).toMatchObject([
      { checkKey: "CONFIGURATION_READINESS", state: "NOT_RUN" },
      { checkKey: "SENSOR_MAPPING", state: "NOT_RUN" },
    ]);
  });

  function createSession(siteId: number, uuid: string): number {
    return repository.createSession({
      uuid,
      siteId,
      platformVersion: "0.17.0",
      commissioningRevision: "P3-03",
      engineerIdentity: "operator#7",
      openedAt: "2026-09-01T10:50:00.000Z",
    });
  }
});
