import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { AUDIT_REDACTED_VALUE } from "../../modules/audit/audit-redaction";
import { AuditEventRepository } from "../../repositories/audit-event.repository";
import { AuditEventService } from "../audit-event.service";

describe("AuditEvent service", () => {
  let database: Database.Database;
  let repository: AuditEventRepository;
  let service: AuditEventService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    database.prepare("INSERT INTO sites (id) VALUES (1), (2)").run();
    migration010.up(database);
    repository = new AuditEventRepository(database);
    service = new AuditEventService({
      repository,
      generateId: () => "audit-id",
      now: () => new Date("2026-08-24T12:00:00.000Z"),
    });
  });

  afterEach(() => database.close());

  it("owns authoritative identity/time and persists deterministic safe values", () => {
    const event = service.record({
      actor: { kind: "PLATFORM", id: "owner-1", username: "owner", role: "SYSTEM_OWNER" },
      action: "CONFIGURATION.UPDATED",
      siteId: 1,
      result: "SUCCESS",
      previousValues: {
        password: "PlaintextPassword1",
        nested: {
          accessToken: "token-value",
          safe: "preserved",
          hash: "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK",
        },
      },
      newValues: {
        headers: { authorization: "Bearer sensitive-token" },
        privateMaterial: "-----BEGIN PRIVATE KEY-----\nsecret",
      },
      requestContext: { source: "OWNER_API" },
    });

    expect(event.id).toBe("audit-id");
    expect(event.occurredAt).toBe("2026-08-24T12:00:00.000Z");
    expect(event.previousValues).toEqual({
      password: AUDIT_REDACTED_VALUE,
      nested: {
        accessToken: AUDIT_REDACTED_VALUE,
        safe: "preserved",
        hash: AUDIT_REDACTED_VALUE,
      },
    });
    expect(event.newValues).toEqual({
      headers: { authorization: AUDIT_REDACTED_VALUE },
      privateMaterial: AUDIT_REDACTED_VALUE,
    });

    const raw = String(
      database
        .prepare("SELECT previous_values_json || new_values_json FROM audit_events")
        .pluck()
        .get()
    );
    expect(raw).not.toMatch(
      /PlaintextPassword1|sensitive-token|token-value|BEGIN PRIVATE KEY|\$2b\$/
    );
  });

  it("fails without persistence for unsupported circular values", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() =>
      service.record({
        actor: { kind: "CUSTOMER_USER", id: "1", username: "admin", role: "ADMIN" },
        action: "TEST.CIRCULAR",
        result: "FAILED",
        newValues: circular,
        requestContext: { source: "TEST" },
      })
    ).toThrow("Circular audit values are not supported");
    expect(repository.list({ limit: 10 })).toEqual([]);
  });

  it("redacts secrets embedded in free-text audit context", () => {
    const event = service.record({
      actor: { kind: "PLATFORM", id: "owner-1", username: "owner", role: "SYSTEM_OWNER" },
      action: "AUDIT.TEST",
      result: "DENIED",
      requestContext: {
        source: "authorization=plaintext-token",
        requestId: "request with Bearer plaintext-token",
      },
      reason: "request rejected: Bearer plaintext-token",
    });

    expect(event.reason).toBe(AUDIT_REDACTED_VALUE);
    expect(event.requestContext.source).toBe(AUDIT_REDACTED_VALUE);
    expect(event.requestContext.requestId).toBe(AUDIT_REDACTED_VALUE);

    const raw = JSON.stringify(
      database.prepare("SELECT * FROM audit_events WHERE id = ?").get(event.id)
    );
    expect(raw).not.toContain("plaintext-token");
  });

  it("keeps customer reads constrained to the requested Site", () => {
    service.record({
      actor: { kind: "CUSTOMER_USER", id: "1", username: "admin", role: "ADMIN" },
      action: "SITE.ONE",
      siteId: 1,
      result: "SUCCESS",
      requestContext: { source: "TEST" },
    });
    service = new AuditEventService({
      repository,
      generateId: () => "audit-id-2",
      now: () => new Date("2026-08-24T12:01:00.000Z"),
    });
    service.record({
      actor: { kind: "CUSTOMER_USER", id: "1", username: "admin", role: "ADMIN" },
      action: "SITE.TWO",
      siteId: 2,
      result: "SUCCESS",
      requestContext: { source: "TEST" },
    });

    expect(service.listForCustomerSite(1, 100).map(({ action }) => action)).toEqual(["SITE.ONE"]);
  });
});
