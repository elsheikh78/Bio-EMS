import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { AuditEventRepository } from "../audit-event.repository";

describe("append-only AuditEvent repository", () => {
  let database: Database.Database;
  let repository: AuditEventRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    database.prepare("INSERT INTO sites (id) VALUES (1), (2)").run();
    migration010.up(database);
    repository = new AuditEventRepository(database);
  });

  afterEach(() => database.close());

  it("persists and returns the complete immutable event contract", () => {
    const event = repository.append(eventInput("evt-1", "2026-08-24T09:00:00.000Z", 1));

    expect(event).toEqual({
      id: "evt-1",
      occurredAt: "2026-08-24T09:00:00.000Z",
      actor: {
        kind: "CUSTOMER_USER",
        id: "7",
        username: "admin",
        role: "ADMIN",
      },
      action: "SENSOR.THRESHOLDS_UPDATED",
      target: { type: "SENSOR", id: "sensor-1" },
      siteId: 1,
      result: "SUCCESS",
      previousValues: { warning_high: 8 },
      newValues: { warning_high: 7.5 },
      requestContext: {
        requestId: "request-1",
        sessionId: "session-1",
        correlationId: "correlation-1",
        source: "REST_API",
      },
      reason: "Approved configuration change",
      createdAt: expect.any(String),
    });
  });

  it("orders deterministically and enforces the requested Site scope", () => {
    repository.append(eventInput("evt-b", "2026-08-24T10:00:00.000Z", 1));
    repository.append(eventInput("evt-a", "2026-08-24T10:00:00.000Z", 1));
    repository.append(eventInput("evt-other", "2026-08-24T11:00:00.000Z", 2));

    expect(repository.list({ siteId: 1, limit: 10 }).map(({ id }) => id)).toEqual([
      "evt-b",
      "evt-a",
    ]);
    expect(repository.list({ siteId: 2, limit: 10 }).map(({ id }) => id)).toEqual(["evt-other"]);
  });

  it("rejects duplicate immutable event identities", () => {
    repository.append(eventInput("evt-1", "2026-08-24T09:00:00.000Z", 1));

    expect(() => repository.append(eventInput("evt-1", "2026-08-24T10:00:00.000Z", 1))).toThrow();
    expect(repository.list({ limit: 10 })).toHaveLength(1);
  });

  it("blocks UPDATE and DELETE even through direct SQL", () => {
    repository.append(eventInput("evt-1", "2026-08-24T09:00:00.000Z", 1));

    expect(() =>
      database.prepare("UPDATE audit_events SET result = 'FAILED' WHERE id = 'evt-1'").run()
    ).toThrow("audit_events are append-only");
    expect(() => database.prepare("DELETE FROM audit_events WHERE id = 'evt-1'").run()).toThrow(
      "audit_events are append-only"
    );
    expect(repository.findById("evt-1")?.result).toBe("SUCCESS");
  });
});

function eventInput(id: string, occurredAt: string, siteId: number) {
  return {
    id,
    occurredAt,
    actor: {
      kind: "CUSTOMER_USER" as const,
      id: "7",
      username: "admin",
      role: "ADMIN",
    },
    action: "SENSOR.THRESHOLDS_UPDATED",
    target: { type: "SENSOR", id: "sensor-1" },
    siteId,
    result: "SUCCESS" as const,
    previousValues: { warning_high: 8 },
    newValues: { warning_high: 7.5 },
    requestContext: {
      requestId: "request-1",
      sessionId: "session-1",
      correlationId: "correlation-1",
      source: "REST_API",
    },
    reason: "Approved configuration change",
  };
}
