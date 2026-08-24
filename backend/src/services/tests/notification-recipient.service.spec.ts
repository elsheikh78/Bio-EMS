import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { migration012 } from "../../../database/sqlite/migrations/012_create_notification_recipients";
import { AuditActorSnapshot } from "../../entities/AuditEvent";
import { AuditEventRepository } from "../../repositories/audit-event.repository";
import { NotificationRecipientRepository } from "../../repositories/notification-recipient.repository";
import { AuditEventService } from "../audit-event.service";
import { NotificationRecipientService } from "../notification-recipient.service";

const actor: AuditActorSnapshot = {
  kind: "CUSTOMER_USER",
  id: "1",
  username: "admin",
  role: "ADMIN",
};
const context = { source: "NOTIFICATION_RECIPIENT_API" } as const;
const uuid = "b3d90e36-faf5-4a46-96dc-376dbc1475cb";
const input = {
  uuid,
  site_id: 7,
  display_name: "Quality contact",
  role: "QUALITY" as const,
  endpoints: [
    {
      channel: "EMAIL" as const,
      address: "quality@example.com",
      eligible_severities: ["CRITICAL" as const],
    },
    {
      channel: "SMS" as const,
      address: "+201001234567",
      eligible_severities: ["WARNING" as const, "CRITICAL" as const],
    },
  ],
};

describe("Notification recipient service", () => {
  let database: Database.Database;
  let repository: NotificationRecipientRepository;
  let audits: AuditEventRepository;
  let service: NotificationRecipientService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY); INSERT INTO sites VALUES (7)");
    migration010.up(database);
    migration012.up(database);
    repository = new NotificationRecipientRepository(database);
    audits = new AuditEventRepository(database);
    service = new NotificationRecipientService({
      repository,
      sites: { findById: () => ({ id: 7, code: "SITE-7", name: "Site 7" }) },
      auditService: new AuditEventService({ repository: audits }),
      runInTransaction: (operation) => database.transaction(operation)(),
    });
  });

  afterEach(() => database.close());

  it("creates contact endpoints atomically while excluding addresses from audit values", () => {
    const created = service.create(actor, input, context);
    expect(created.endpoints.map(({ address }) => address)).toEqual([
      "quality@example.com",
      "+201001234567",
    ]);
    const audit = audits.list({ siteId: 7, limit: 10 })[0]!;
    expect(audit).toMatchObject({
      action: "NOTIFICATION_RECIPIENT.CREATED",
      result: "SUCCESS",
      siteId: 7,
      newValues: {
        display_name: "Quality contact",
        role: "QUALITY",
        status: "active",
      },
    });
    expect(JSON.stringify(audit)).not.toMatch(/quality@example|\+201001234567/);
  });

  it("resolves only active Site/channel/severity-eligible recipients", () => {
    service.create(actor, input, context);
    expect(service.resolveEligible(7, "SMS", "WARNING").map(({ uuid: id }) => id)).toEqual([uuid]);
    expect(service.resolveEligible(7, "EMAIL", "WARNING")).toEqual([]);

    service.updateStatus(actor, uuid, { status: "inactive" }, context);
    expect(service.resolveEligible(7, "SMS", "CRITICAL")).toEqual([]);
  });

  it("updates safe identity and endpoint eligibility without auditing contact addresses", () => {
    service.create(actor, input, context);
    service.update(
      actor,
      uuid,
      {
        role: "MANAGEMENT",
        endpoints: [
          { channel: "WHATSAPP", address: "+201112345678", eligible_severities: ["CRITICAL"] },
        ],
      },
      context
    );
    const audit = audits.list({ siteId: 7, limit: 10 })[0]!;
    expect(audit).toMatchObject({ action: "NOTIFICATION_RECIPIENT.UPDATED", result: "SUCCESS" });
    expect(JSON.stringify(audit)).not.toContain("+201112345678");
    expect(repository.findByUuid(uuid)).toMatchObject({ role: "MANAGEMENT" });
  });

  it("rolls back recipient creation when audit persistence fails", () => {
    database.exec(`CREATE TRIGGER bf06_block_audit BEFORE INSERT ON audit_events
      BEGIN SELECT RAISE(ABORT, 'blocked audit'); END;`);
    expect(() => service.create(actor, input, context)).toThrow();
    expect(repository.findByUuid(uuid)).toBeUndefined();
  });
});
