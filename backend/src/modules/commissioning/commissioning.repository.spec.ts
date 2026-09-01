import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration017 } from "../../../database/sqlite/migrations/017_create_commissioning_evidence";
import { CommissioningRepository } from "./commissioning.repository";

describe("CommissioningRepository", () => {
  let database: Database.Database;
  let repository: CommissioningRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY);
      CREATE TABLE devices (id INTEGER PRIMARY KEY);
      CREATE TABLE sensors (id INTEGER PRIMARY KEY);
      INSERT INTO sites (id) VALUES (1);
    `);
    migration017.up(database);
    repository = new CommissioningRepository(database);
  });

  afterEach(() => database.close());

  it("persists a session, check and attributable evidence", () => {
    const sessionId = repository.createSession({
      uuid: "commissioning-1",
      siteId: 1,
      platformVersion: "0.17.0",
      commissioningRevision: "P3-02",
      engineerIdentity: "engineer@example",
      openedAt: "2026-09-01T07:00:00.000Z",
    });
    const checkId = repository.addCheck({
      sessionId,
      checkKey: "COMMUNICATION",
      title: "Communication verification",
      mandatory: true,
      physicalOrLiveGate: true,
    });
    const evidenceId = repository.appendEvidence({
      sessionId,
      checkId,
      state: "PASS",
      evidenceKind: "PHYSICAL",
      executedAt: "2026-09-01T07:01:00.000Z",
      actorIdentity: "engineer@example",
      evidenceReference: "EV-001",
    });

    const row = database
      .prepare("SELECT evidence_kind, evidence_reference FROM commissioning_evidence WHERE id = ?")
      .get(evidenceId) as { evidence_kind: string; evidence_reference: string };

    expect(row).toEqual({ evidence_kind: "PHYSICAL", evidence_reference: "EV-001" });
  });

  it("persists deviations and immutable decisions", () => {
    const sessionId = repository.createSession({
      uuid: "commissioning-2",
      siteId: 1,
      platformVersion: "0.17.0",
      commissioningRevision: "P3-02",
      engineerIdentity: "engineer@example",
      openedAt: "2026-09-01T07:00:00.000Z",
    });

    repository.appendDeviation(sessionId, {
      reference: "DEV-001",
      classification: "NON_BLOCKING",
      description: "Document follow-up",
      recordedAt: "2026-09-01T07:02:00.000Z",
      actorIdentity: "engineer@example",
    });
    const decisionId = repository.appendDecision({
      sessionId,
      decision: "REJECTED",
      decidedAt: "2026-09-01T07:03:00.000Z",
      actorIdentity: "engineer@example",
      snapshot: { acceptable: false },
    });

    expect(repository.listDeviations(sessionId)).toEqual([
      { reference: "DEV-001", classification: "NON_BLOCKING" },
    ]);
    expect(() =>
      database
        .prepare("UPDATE commissioning_decisions SET decision = 'ACCEPTED' WHERE id = ?")
        .run(decisionId)
    ).toThrow("commissioning decisions are append-only");
  });
});
