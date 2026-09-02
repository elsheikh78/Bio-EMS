import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { PlatformOperationsRepository } from "./platform-operations.repository";

describe("isolated platform commercial operations", () => {
  let db: Database.Database;
  let repository: PlatformOperationsRepository;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys=ON");
    db.exec(`
      CREATE TABLE sites(
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        timezone TEXT,
        active INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO sites(id,code,name,location,timezone,active)
      VALUES(7,'OCT','6th October','Giza','Africa/Cairo',1);
    `);
    migration018.up(db);
    repository = new PlatformOperationsRepository(db);
  });

  afterEach(() => db.close());

  it("records customer, license and maintenance with SYSTEM_OWNER provenance", () => {
    const customerId = repository.createCustomer(
      {
        code: "BIO-EGYPT",
        name: "BIO EGYPT",
        status: "ACTIVE",
        createdAt: "2026-09-01T12:00:00Z",
      },
      "owner#1"
    );
    repository.createLicense(
      {
        customerId,
        siteId: 7,
        licenseKeyReference: "LIC-001",
        edition: "PILOT",
        status: "ACTIVE",
        startsAt: "2026-09-01T12:00:00Z",
        updateEntitlement: "FREE",
        recordedAt: "2026-09-01T12:01:00Z",
      },
      "owner#1"
    );
    repository.createMaintenance(
      {
        customerId,
        siteId: 7,
        eventType: "CALIBRATION",
        status: "OPEN",
        reference: "CAL-DUE-001",
        recordedAt: "2026-09-01T12:02:00Z",
      },
      "owner#1"
    );

    expect(repository.overview()).toMatchObject({
      customers: [{ code: "BIO-EGYPT", createdBy: "owner#1" }],
      sites: [{ id: 7, code: "OCT", name: "6th October" }],
      licenses: [{ siteId: 7, updateEntitlement: "FREE" }],
      serviceEvents: [{ siteId: 7, reference: "CAL-DUE-001" }],
      commercialEvents: [
        { eventType: "SERVICE_EVENT_RECORDED", actorIdentity: "owner#1" },
        { eventType: "LICENSE_RECORDED", actorIdentity: "owner#1" },
        { eventType: "CUSTOMER_CREATED", actorIdentity: "owner#1" },
      ],
    });
    expect(
      db.prepare("SELECT DISTINCT actor_identity FROM platform_commercial_events").all()
    ).toEqual([{ actor_identity: "owner#1" }]);
  });

  it("keeps commercial event evidence append-only", () => {
    repository.createCustomer(
      {
        code: "C1",
        name: "Customer",
        status: "ACTIVE",
        createdAt: "2026-09-01T12:00:00Z",
      },
      "owner#1"
    );
    expect(() => db.prepare("DELETE FROM platform_commercial_events").run()).toThrow(
      "commercial events are append-only"
    );
  });

  it("updates license entitlement/binding and service state with append-only provenance", () => {
    const customerId = repository.createCustomer(
      { code: "C1", name: "Customer", status: "ACTIVE", createdAt: "2026-09-01T12:00:00Z" },
      "owner#1"
    );
    const licenseId = repository.createLicense(
      {
        customerId,
        licenseKeyReference: "L1",
        edition: "STANDARD",
        status: "ACTIVE",
        startsAt: "2026-09-01T12:00:00Z",
        updateEntitlement: "NONE",
        recordedAt: "2026-09-01T12:01:00Z",
      },
      "owner#1"
    );
    const serviceId = repository.createMaintenance(
      {
        customerId,
        eventType: "SUPPORT",
        status: "OPEN",
        reference: "S1",
        recordedAt: "2026-09-01T12:02:00Z",
      },
      "owner#1"
    );
    repository.updateLicense(
      licenseId,
      { siteId: 7, status: "ACTIVE", expiresAt: null, updateEntitlement: "FREE" },
      "owner#2"
    );
    repository.updateMaintenance(
      serviceId,
      { dueAt: null, status: "COMPLETE", note: "Closed" },
      "owner#2"
    );
    expect(repository.overview()).toMatchObject({
      licenses: [{ siteId: 7, updateEntitlement: "FREE" }],
      serviceEvents: [{ status: "COMPLETE", note: "Closed" }],
    });
    expect(repository.overview().commercialEvents.slice(0, 2)).toMatchObject([
      { eventType: "SERVICE_EVENT_UPDATED", actorIdentity: "owner#2" },
      { eventType: "LICENSE_UPDATED", actorIdentity: "owner#2" },
    ]);
  });
});
