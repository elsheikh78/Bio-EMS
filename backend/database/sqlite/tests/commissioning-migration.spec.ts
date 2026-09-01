import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration017 } from "../migrations/017_create_commissioning_evidence";

const SESSION_SQL = `
  INSERT INTO commissioning_sessions (
    uuid,
    site_id,
    platform_version,
    commissioning_revision,
    engineer_identity,
    opened_at
  ) VALUES ('session-1', 1, '0.17.0', 'P3-01', 'engineer@example', '2026-09-01T06:30:00.000Z')
`;

const CHECK_SQL = `
  INSERT INTO commissioning_checks (session_id, check_key, title)
  VALUES (1, 'COMMUNICATION', 'Communication verification')
`;

function seedSession(database: Database.Database): void {
  database.prepare("INSERT INTO sites (id) VALUES (1)").run();
  database.prepare(SESSION_SQL).run();
  database.prepare(CHECK_SQL).run();
}

describe("commissioning persistence migration", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY);
      CREATE TABLE devices (id INTEGER PRIMARY KEY);
      CREATE TABLE sensors (id INTEGER PRIMARY KEY);
    `);
  });

  afterEach(() => database.close());

  it("is idempotent and creates the controlled commissioning tables", () => {
    migration017.up(database);
    migration017.up(database);

    const sql =
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'commissioning_%'";
    const tables = database.prepare(sql).all() as Array<{ name: string }>;
    const names = tables.map(({ name }) => name).sort();

    expect(names).toEqual([
      "commissioning_checks",
      "commissioning_decisions",
      "commissioning_deviations",
      "commissioning_evidence",
      "commissioning_sessions",
    ]);
  });

  it("keeps execution evidence, deviations and decisions append-only", () => {
    migration017.up(database);
    seedSession(database);

    database
      .prepare(
        `
        INSERT INTO commissioning_evidence (
          session_id,
          check_id,
          state,
          executed_at,
          actor_identity,
          evidence_reference
        ) VALUES (1, 1, 'PASS', '2026-09-01T06:31:00.000Z', 'engineer@example', 'EV-001')
      `
      )
      .run();
    database
      .prepare(
        `
        INSERT INTO commissioning_deviations (
          session_id,
          reference,
          classification,
          description,
          recorded_at,
          actor_identity
        ) VALUES (1, 'DEV-001', 'NON_BLOCKING', 'example', '2026-09-01T06:32:00.000Z', 'engineer@example')
      `
      )
      .run();
    database
      .prepare(
        `
        INSERT INTO commissioning_decisions (
          session_id,
          decision,
          decided_at,
          actor_identity,
          snapshot_json
        ) VALUES (1, 'REJECTED', '2026-09-01T06:33:00.000Z', 'engineer@example', '{}')
      `
      )
      .run();

    const updateEvidence = () => {
      database.prepare("UPDATE commissioning_evidence SET state = 'FAIL'").run();
    };
    const deleteDeviation = () => {
      database.prepare("DELETE FROM commissioning_deviations").run();
    };
    const updateDecision = () => {
      database.prepare("UPDATE commissioning_decisions SET decision = 'ACCEPTED'").run();
    };

    expect(updateEvidence).toThrow("commissioning evidence is append-only");
    expect(deleteDeviation).toThrow("commissioning deviations are append-only");
    expect(updateDecision).toThrow("commissioning decisions are append-only");
  });

  it("rejects invalid evidence states and decision snapshots", () => {
    migration017.up(database);
    seedSession(database);

    const insertInvalidEvidence = () => {
      database
        .prepare(
          `
          INSERT INTO commissioning_evidence (
            session_id,
            check_id,
            state,
            executed_at,
            actor_identity
          ) VALUES (1, 1, 'AUTOMATED_PASS', '2026-09-01T06:31:00.000Z', 'engineer@example')
        `
        )
        .run();
    };
    const insertInvalidDecision = () => {
      database
        .prepare(
          `
          INSERT INTO commissioning_decisions (
            session_id,
            decision,
            decided_at,
            actor_identity,
            snapshot_json
          ) VALUES (1, 'ACCEPTED', '2026-09-01T06:32:00.000Z', 'engineer@example', 'not-json')
        `
        )
        .run();
    };

    expect(insertInvalidEvidence).toThrow();
    expect(insertInvalidDecision).toThrow();
  });
});
