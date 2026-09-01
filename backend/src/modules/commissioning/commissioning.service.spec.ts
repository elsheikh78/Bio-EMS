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
      CREATE TABLE devices (id INTEGER PRIMARY KEY);
      CREATE TABLE sensors (id INTEGER PRIMARY KEY);
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
    ).toThrow("COMMISSIONING_ACCEPTANCE_BLOCKED:check:1:NOT_RUN");
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
    ).toThrow("PHYSICAL_OR_LIVE_EVIDENCE_REQUIRED");
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
    ).toThrow("COMMISSIONING_SESSION_NOT_FOUND");
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
