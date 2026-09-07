import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTables } from "../../../database/sqlite/schema";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration020 } from "../../../database/sqlite/migrations/020_create_installation_lifecycle";
import { migration022 } from "../../../database/sqlite/migrations/022_create_site_bound_licensing_domain";
import { migration024 } from "../../../database/sqlite/migrations/024_create_licensing_governance";
import { evaluateOfflineWindow, LicenseGovernanceService } from "./license-governance.service";

describe("LIC-07 through LIC-10 governance", () => {
  let database: Database.Database;
  let service: LicenseGovernanceService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    createTables(database);
    migration018.up(database);
    migration020.up(database);
    migration022.up(database);
    migration024.up(database);
    database
      .prepare(
        "INSERT INTO platform_customers (id,code,name,status,created_at,created_by) VALUES (1,'C1','Customer','ACTIVE','now','owner')"
      )
      .run();
    database
      .prepare("INSERT INTO sites (id,code,name) VALUES (1,'S1','Site 1'),(2,'S2','Site 2')")
      .run();
    database
      .prepare(
        "INSERT INTO devices (id,uuid,device_id,site_id,device_type,protocol) VALUES (1,'uuid-1','GW-1',1,'GATEWAY','mqtt'),(2,'uuid-2','GW-2',2,'GATEWAY','mqtt')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO licensing_installations (id,installation_uuid,customer_id,site_id,status,created_at,created_by,updated_at) VALUES (1,'I1',1,1,'ACTIVE','now','owner','now'),(2,'I2',1,1,'PENDING','now','owner','now'),(3,'I3',1,2,'PENDING','now','owner','now')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO site_bound_licenses (id,license_uuid,installation_id,schema_version,license_type,status,starts_at,update_entitlement,offline_policy_json,created_at,created_by) VALUES (1,'L1',1,1,'SUBSCRIPTION','ACTIVE','2026-01-01','PAID','{}','now','owner')"
      )
      .run();
    service = new LicenseGovernanceService(database);
  });
  afterEach(() => database.close());

  it("authorizes only a device from the licensed Site", () => {
    service.bindDevice(1, 1, "owner");
    expect(service.overview().devices).toHaveLength(1);
    expect(() => service.bindDevice(1, 2, "owner")).toThrow("Device belongs to another Site");
  });

  it("applies offline grace without treating indefinite disconnection as valid", () => {
    expect(evaluateOfflineWindow("2026-09-01T00:00:00.000Z", 604800, new Date("2026-09-05"))).toBe(
      "OFFLINE_GRACE"
    );
    expect(evaluateOfflineWindow("2026-09-01T00:00:00.000Z", 604800, new Date("2026-09-20"))).toBe(
      "RESTRICTED"
    );
    service.recordValidation(
      1,
      "OFFLINE_GRACE",
      "runtime",
      "2026-09-05T00:00:00.000Z",
      "2026-09-08T00:00:00.000Z"
    );
    expect(database.prepare("SELECT result FROM license_validation_events").get()).toEqual({
      result: "OFFLINE_GRACE",
    });
  });

  it("records same-scope transfer and leaves the old signed license superseded", () => {
    service.transfer(1, 2, "Replacement PC", "owner", "2026-09-07T00:00:00.000Z");
    expect(
      database.prepare("SELECT status,installation_id FROM site_bound_licenses WHERE id=1").get()
    ).toEqual({ status: "SUPERSEDED", installation_id: 1 });
    expect(
      database
        .prepare("SELECT from_installation_id,to_installation_id FROM license_transfers")
        .get()
    ).toEqual({ from_installation_id: 1, to_installation_id: 2 });
    expect(() => service.transfer(1, 3, "Wrong site", "owner")).toThrow(
      "Transfer must remain within the licensed Customer and Site"
    );
  });

  it("revokes license and installation with append-only audit evidence", () => {
    service.transition(1, "REVOKED", "owner", "2026-09-07T00:00:00.000Z");
    expect(database.prepare("SELECT status FROM site_bound_licenses WHERE id=1").get()).toEqual({
      status: "REVOKED",
    });
    expect(database.prepare("SELECT status FROM licensing_installations WHERE id=1").get()).toEqual(
      { status: "REVOKED" }
    );
    expect(() => database.prepare("DELETE FROM license_events").run()).toThrow(
      "license events are append-only"
    );
  });
});
