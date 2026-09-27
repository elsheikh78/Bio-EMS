import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration019 } from "../../../database/sqlite/migrations/019_create_customer_ownership";
import { migration020 } from "../../../database/sqlite/migrations/020_create_installation_lifecycle";
import { createTables } from "../../../database/sqlite/schema";
import { InstallationService } from "./installation.service";
import type { InstallationSnapshot } from "./installation.schema";

const snapshot: InstallationSnapshot = {
  companyName: "BIO Customer",
  sites: [
    {
      code: "SITE1",
      name: "Main Site",
      timezone: "Africa/Cairo",
      areas: [
        {
          code: "COLD1",
          name: "Cold Room",
          telemetries: [
            {
              code: "TEMP1",
              name: "Temperature",
              type: "TEMPERATURE",
              unit: "C",
              warningLow: 3,
              alarmLow: 1,
              warningHigh: 8,
              alarmHigh: 10,
              warningDelaySeconds: 30,
              criticalDelaySeconds: 10,
              calibrationOffset: 0,
            },
          ],
        },
      ],
    },
  ],
  devices: [
    {
      deviceId: "CTRL1",
      siteCode: "SITE1",
      type: "zone-controller",
      protocol: "mqtt",
      mappings: [{ areaCode: "COLD1", telemetryCode: "TEMP1", channel: 0 }],
    },
  ],
};

describe("controlled installation lifecycle", () => {
  let database: Database.Database;
  let service: InstallationService;
  let customerId: number;
  let adminId: number;
  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys=ON");
    createTables(database);
    database.exec(
      `CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE,email TEXT,password_hash TEXT NOT NULL,role TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`
    );
    migration018.up(database);
    migration019.up(database);
    migration020.up(database);
    customerId = Number(
      database
        .prepare(
          `INSERT INTO platform_customers(code,name,status,created_at,created_by) VALUES('C1','BIO Customer','ACTIVE',?,'owner')`
        )
        .run(new Date().toISOString()).lastInsertRowid
    );

    const siteId = Number(
      database
        .prepare(
          `INSERT INTO sites(code,name,location,timezone,active)
           VALUES('SITE1','Main Site',NULL,'Africa/Cairo',1)`
        )
        .run().lastInsertRowid
    );
    database
      .prepare(
        `INSERT INTO customer_site_bindings(customer_id,site_id,bound_at,bound_by)
         VALUES(?,?,?,'owner')`
      )
      .run(customerId, siteId, new Date().toISOString());
    adminId = Number(
      database
        .prepare(
          `INSERT INTO users(username,password_hash,role,status) VALUES('admin','hash','ADMIN','active')`
        )
        .run().lastInsertRowid
    );
    database
      .prepare(
        `INSERT INTO customer_user_bindings(customer_id,user_id,bound_at,bound_by) VALUES(?,?,?,'owner')`
      )
      .run(customerId, adminId, new Date().toISOString());
    service = new InstallationService(database);
  });
  afterEach(() => database.close());

  it("requires exact device receipt and both independent acceptance gates before activation", () => {
    const draft = service.create(customerId, snapshot, "owner#1");
    service.validate(draft.uuid, "owner#1");
    service.queue(draft.uuid, "owner#1");
    service.send(draft.uuid, "owner#1");
    expect(() =>
      service.receipt(draft.uuid, {
        revision: 1,
        checksum: "0".repeat(64),
        deviceIdentity: "CTRL1",
      })
    ).toThrow(expect.objectContaining({ code: "DEVICE_RECEIPT_MISMATCH" }));
    expect(database.prepare("SELECT matched FROM platform_installation_receipts").all()).toEqual([
      { matched: 0 },
    ]);
    service.receipt(draft.uuid, { revision: 1, checksum: draft.checksum, deviceIdentity: "CTRL1" });
    markMaterializedSiteReady();
    service.technicalDecision(draft.uuid, "ACCEPT", "Bench and live checks passed", "owner#1");
    const active = service.customerDecision(draft.uuid, adminId, "ACCEPT", "Customer accepted");
    expect(active).toMatchObject({ status: "COMMISSIONED", latestRevision: 1 });
    expect(database.prepare("SELECT code FROM sites").all()).toEqual([{ code: "SITE1" }]);
    expect(database.prepare("SELECT code FROM rooms").all()).toEqual([{ code: "COLD1" }]);
    expect(database.prepare("SELECT code FROM sensors").all()).toEqual([{ code: "TEMP1" }]);
    expect(database.prepare("SELECT device_id FROM devices").all()).toEqual([
      { device_id: "CTRL1" },
    ]);
  });

  it("rejects incomplete or duplicate topology before persisting a draft", () => {
    const invalid = { ...snapshot, devices: [] } as InstallationSnapshot;
    expect(() => service.create(customerId, invalid, "owner#1")).toThrow(
      expect.objectContaining({ code: "TELEMETRY_MAPPING_REQUIRED" })
    );
    expect(service.list()).toEqual([]);
  });

  it("rejects customer or Site identity that contradicts the Setup registry", () => {
    expect(() =>
      service.create(customerId, { ...snapshot, companyName: "Different customer" }, "owner#1")
    ).toThrow(
      expect.objectContaining({
        code: "INSTALLATION_CUSTOMER_IDENTITY_MISMATCH",
      })
    );

    const wrongSite = {
      ...snapshot,
      sites: snapshot.sites.map((site) => ({
        ...site,
        name: "Different Site",
      })),
    };
    expect(() => service.create(customerId, wrongSite, "owner#1")).toThrow(
      expect.objectContaining({ code: "INSTALLATION_SITE_IDENTITY_MISMATCH" })
    );
  });

  it("prevents a second logical installation for the same registered Site", () => {
    service.create(customerId, snapshot, "owner#1");
    expect(() => service.create(customerId, snapshot, "owner#1")).toThrow(
      expect.objectContaining({ code: "INSTALLATION_SITE_ALREADY_CONFIGURED" })
    );
  });

  it("resolves the customer installation automatically from the selected Site", () => {
    const draft = service.create(customerId, snapshot, "owner#1");
    const siteId = Number(database.prepare("SELECT id FROM sites WHERE code='SITE1'").pluck().get());

    expect(service.getAcceptanceStateForCustomerSite(siteId, adminId)).toMatchObject({
      siteId,
      siteCode: "SITE1",
      siteName: "Main Site",
      installation: {
        uuid: draft.uuid,
        status: "DRAFT",
        latestRevision: 1,
        acceptanceEnabled: false,
        technicalCommissioning: null,
        customerAcceptance: null,
      },
    });
  });

  it("blocks technical acceptance until sensors are valid and devices are online", () => {
    const draft = service.create(customerId, snapshot, "owner#1");
    service.validate(draft.uuid, "owner#1");
    service.queue(draft.uuid, "owner#1");
    service.send(draft.uuid, "owner#1");
    service.receipt(draft.uuid, {
      revision: 1,
      checksum: draft.checksum,
      deviceIdentity: "CTRL1",
    });

    expect(() =>
      service.technicalDecision(draft.uuid, "ACCEPT", "premature", "owner#1")
    ).toThrow(expect.objectContaining({ code: "COMMISSIONING_READINESS_REQUIRED" }));

    markMaterializedSiteReady();
    expect(
      service.technicalDecision(draft.uuid, "ACCEPT", "ready", "owner#1")
    ).toMatchObject({ status: "CUSTOMER_ACCEPTANCE_PENDING" });
  });

  it("isolates customer reads and acceptance", () => {
    const draft = service.create(customerId, snapshot, "owner#1");
    expect(() => service.getForCustomerUser(draft.uuid, 999)).toThrow(
      expect.objectContaining({ code: "INSTALLATION_NOT_FOUND" })
    );
  });
  function markMaterializedSiteReady() {
    const now = new Date().toISOString();
    database
      .prepare(
        `UPDATE devices
         SET status='active',activated=1,last_seen_at=?,last_heartbeat_at=?
         WHERE device_id='CTRL1'`
      )
      .run(now, now);
    database
      .prepare(
        `UPDATE sensors
         SET calibration_status='VALID',
             calibration_due_at='2027-12-31T23:59:59.000Z',
             certificate_reference='CAL-CTRL1-TEMP1',
             enabled=1
         WHERE code='TEMP1'`
      )
      .run();
  }

});
