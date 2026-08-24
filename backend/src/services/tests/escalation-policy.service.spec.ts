import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { migration013 } from "../../../database/sqlite/migrations/013_create_escalation_policies";
import { AuditEventRepository } from "../../repositories/audit-event.repository";
import { EscalationPolicyRepository } from "../../repositories/escalation-policy.repository";
import { AuditEventService } from "../audit-event.service";
import { EscalationPolicyService } from "../escalation-policy.service";

const actor = { kind: "CUSTOMER_USER", id: "1", username: "admin", role: "ADMIN" } as const;
const context = { source: "ESCALATION_POLICY_API" } as const;
const uuid = "0d432ea8-e6a6-4f73-a952-d10800710471";
const input = {
  uuid,
  site_id: 7,
  name: "Critical escalation",
  owner_role: "QUALITY" as const,
  eligible_severities: ["CRITICAL" as const],
  steps: [
    {
      position: 1,
      delay_seconds: 0,
      recipient_role: "PRIMARY_CONTACT" as const,
      channels: ["EMAIL" as const],
    },
    {
      position: 2,
      delay_seconds: 300,
      recipient_role: "MANAGEMENT" as const,
      channels: ["SMS" as const, "WHATSAPP" as const],
    },
  ],
};

describe("Escalation policy service", () => {
  let database: Database.Database;
  let repository: EscalationPolicyRepository;
  let audits: AuditEventRepository;
  let service: EscalationPolicyService;
  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY); INSERT INTO sites VALUES (7)");
    migration010.up(database);
    migration013.up(database);
    repository = new EscalationPolicyRepository(database);
    audits = new AuditEventRepository(database);
    service = new EscalationPolicyService({
      repository,
      sites: { findById: () => ({ id: 7, code: "S7", name: "Site 7" }) },
      auditService: new AuditEventService({ repository: audits }),
      runInTransaction: (operation) => database.transaction(operation)(),
    });
  });
  afterEach(() => database.close());

  it("creates ordered policy and atomic Site audit evidence", () => {
    expect(service.create(actor, input, context).steps.map((step) => step.position)).toEqual([
      1, 2,
    ]);
    expect(audits.list({ siteId: 7, limit: 10 })[0]).toMatchObject({
      action: "ESCALATION_POLICY.CREATED",
      result: "SUCCESS",
      siteId: 7,
    });
  });
  it("resolves only due active severity-eligible steps deterministically", () => {
    service.create(actor, input, context);
    expect(service.resolveDue(7, "CRITICAL", 299)[0]!.steps).toHaveLength(1);
    expect(service.resolveDue(7, "CRITICAL", 300)[0]!.steps).toHaveLength(2);
    expect(service.resolveDue(7, "WARNING", 300)).toEqual([]);
    service.updateStatus(actor, uuid, { status: "inactive" }, context);
    expect(service.resolveDue(7, "CRITICAL", 300)).toEqual([]);
  });
  it("rolls back creation when audit persistence fails", () => {
    database.exec(
      `CREATE TRIGGER bf07_block_audit BEFORE INSERT ON audit_events BEGIN SELECT RAISE(ABORT, 'blocked'); END;`
    );
    expect(() => service.create(actor, input, context)).toThrow();
    expect(repository.findByUuid(uuid)).toBeUndefined();
  });
});
