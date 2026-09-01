import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";

export class PlatformOperationsRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  createCustomer(input: Record<string, unknown>, actor: string): number {
    return this.record(
      "CUSTOMER_CREATED",
      "CUSTOMER",
      () =>
        Number(
          this.database
            .prepare(
              `INSERT INTO platform_customers (code,name,status,created_at,created_by) VALUES (?,?,?,?,?)`
            )
            .run(input.code, input.name, input.status, input.createdAt, actor).lastInsertRowid
        ),
      input,
      actor,
      String(input.createdAt)
    );
  }
  createLicense(input: Record<string, unknown>, actor: string): number {
    return this.record(
      "LICENSE_RECORDED",
      "LICENSE",
      () =>
        Number(
          this.database
            .prepare(
              `INSERT INTO platform_licenses (customer_id,site_id,license_key_reference,edition,status,starts_at,expires_at,update_entitlement,recorded_at,recorded_by) VALUES (?,?,?,?,?,?,?,?,?,?)`
            )
            .run(
              input.customerId,
              input.siteId ?? null,
              input.licenseKeyReference,
              input.edition,
              input.status,
              input.startsAt,
              input.expiresAt ?? null,
              input.updateEntitlement,
              input.recordedAt,
              actor
            ).lastInsertRowid
        ),
      input,
      actor,
      String(input.recordedAt)
    );
  }
  createMaintenance(input: Record<string, unknown>, actor: string): number {
    return this.record(
      "SERVICE_EVENT_RECORDED",
      "SERVICE_EVENT",
      () =>
        Number(
          this.database
            .prepare(
              `INSERT INTO platform_maintenance_events (customer_id,site_id,event_type,due_at,status,reference,note,recorded_at,recorded_by) VALUES (?,?,?,?,?,?,?,?,?)`
            )
            .run(
              input.customerId,
              input.siteId ?? null,
              input.eventType,
              input.dueAt ?? null,
              input.status,
              input.reference,
              input.note ?? null,
              input.recordedAt,
              actor
            ).lastInsertRowid
        ),
      input,
      actor,
      String(input.recordedAt)
    );
  }
  overview() {
    return {
      customers: this.database
        .prepare(
          "SELECT id,code,name,status,created_at AS createdAt FROM platform_customers ORDER BY id"
        )
        .all(),
      licenses: this.database
        .prepare(
          "SELECT id,customer_id AS customerId,site_id AS siteId,license_key_reference AS licenseKeyReference,edition,status,starts_at AS startsAt,expires_at AS expiresAt,update_entitlement AS updateEntitlement FROM platform_licenses ORDER BY id"
        )
        .all(),
      serviceEvents: this.database
        .prepare(
          "SELECT id,customer_id AS customerId,site_id AS siteId,event_type AS eventType,due_at AS dueAt,status,reference,note FROM platform_maintenance_events ORDER BY id"
        )
        .all(),
    };
  }
  private record(
    eventType: string,
    entityType: string,
    insert: () => number,
    snapshot: unknown,
    actor: string,
    occurredAt: string
  ): number {
    return this.database.transaction(() => {
      const id = insert();
      this.database
        .prepare(
          `INSERT INTO platform_commercial_events (event_type,entity_type,entity_id,occurred_at,actor_identity,snapshot_json) VALUES (?,?,?,?,?,?)`
        )
        .run(eventType, entityType, id, occurredAt, actor, JSON.stringify(snapshot));
      return id;
    })();
  }
}
