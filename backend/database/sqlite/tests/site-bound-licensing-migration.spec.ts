import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration018 } from "../migrations/018_create_commercial_operations";
import { migration020 } from "../migrations/020_create_installation_lifecycle";
import { migration022 } from "../migrations/022_create_site_bound_licensing_domain";
import { createTables } from "../schema";

describe("site-bound licensing migration", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    createTables(database);
    migration018.up(database);
    migration020.up(database);
    migration022.up(database);
  });

  afterEach(() => database.close());

  it("binds each licensing installation to one customer and one site", () => {
    const customerId = Number(
      database
        .prepare(
          "INSERT INTO platform_customers (code,name,status,created_at,created_by) VALUES (?,?,?,?,?)"
        )
        .run("BIO-EGYPT", "BIO EGYPT", "ACTIVE", "2026-09-07T00:00:00.000Z", "owner")
        .lastInsertRowid
    );
    const siteId = Number(
      database.prepare("INSERT INTO sites (code,name) VALUES (?,?)").run("MANIAL", "Manial")
        .lastInsertRowid
    );

    database
      .prepare(
        "INSERT INTO licensing_installations (installation_uuid,customer_id,site_id,status,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?)"
      )
      .run(
        "inst-001",
        customerId,
        siteId,
        "PENDING",
        "2026-09-07T00:00:00.000Z",
        "owner",
        "2026-09-07T00:00:00.000Z"
      );

    expect(
      database.prepare("SELECT customer_id,site_id,status FROM licensing_installations").get()
    ).toEqual({
      customer_id: customerId,
      site_id: siteId,
      status: "PENDING",
    });
    expect(() =>
      database
        .prepare(
          "INSERT INTO licensing_installations (installation_uuid,customer_id,site_id,status,created_at,created_by,updated_at) VALUES (?,?,?,?,?,?,?)"
        )
        .run(
          "inst-invalid",
          customerId,
          9999,
          "PENDING",
          "2026-09-07T00:00:00.000Z",
          "owner",
          "2026-09-07T00:00:00.000Z"
        )
    ).toThrow();
  });

  it("enforces license values, entitlement limits and append-only events", () => {
    database
      .prepare(
        "INSERT INTO platform_customers (id,code,name,status,created_at,created_by) VALUES (1,'C1','Customer','ACTIVE','now','owner')"
      )
      .run();
    database.prepare("INSERT INTO sites (id,code,name) VALUES (1,'S1','Site')").run();
    database
      .prepare(
        "INSERT INTO licensing_installations (id,installation_uuid,customer_id,site_id,status,created_at,created_by,updated_at) VALUES (1,'I1',1,1,'PENDING','now','owner','now')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO site_bound_licenses (id,license_uuid,installation_id,schema_version,license_type,status,starts_at,update_entitlement,offline_policy_json,created_at,created_by) VALUES (1,'L1',1,1,'SUBSCRIPTION','DRAFT','2026-09-07T00:00:00.000Z','PAID','{}','now','owner')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO license_entitlements (license_id,module_code,enabled,maximum_sensors) VALUES (1,'TEMPERATURE',1,20)"
      )
      .run();
    database
      .prepare(
        "INSERT INTO license_events (installation_id,license_id,event_type,actor_identity,occurred_at,evidence_json) VALUES (1,1,'LICENSE_DRAFTED','owner','now','{}')"
      )
      .run();

    expect(() =>
      database.prepare("UPDATE license_events SET event_type='CHANGED' WHERE id=1").run()
    ).toThrow("license events are append-only");
    expect(() =>
      database
        .prepare(
          "INSERT INTO license_entitlements (license_id,module_code,enabled,maximum_sensors) VALUES (1,'BAD',1,-1)"
        )
        .run()
    ).toThrow();
  });

  it("is idempotent", () => {
    migration022.up(database);
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='site_bound_licenses'")
        .get()
    ).toEqual({
      name: "site_bound_licenses",
    });
  });
});
