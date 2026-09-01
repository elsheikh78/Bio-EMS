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
    db.exec("CREATE TABLE sites(id INTEGER PRIMARY KEY); INSERT INTO sites VALUES(7)");
    migration018.up(db);
    repository = new PlatformOperationsRepository(db);
  });
  afterEach(() => db.close());
  it("records customer, license and maintenance with SYSTEM_OWNER provenance", () => {
    const customerId = repository.createCustomer(
      { code: "BIO-EGYPT", name: "BIO EGYPT", status: "ACTIVE", createdAt: "2026-09-01T12:00:00Z" },
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
      customers: [{ code: "BIO-EGYPT" }],
      licenses: [{ updateEntitlement: "FREE" }],
      serviceEvents: [{ reference: "CAL-DUE-001" }],
    });
    expect(
      db.prepare("SELECT DISTINCT actor_identity FROM platform_commercial_events").all()
    ).toEqual([{ actor_identity: "owner#1" }]);
  });
  it("keeps commercial event evidence append-only", () => {
    repository.createCustomer(
      { code: "C1", name: "Customer", status: "ACTIVE", createdAt: "2026-09-01T12:00:00Z" },
      "owner#1"
    );
    expect(() => db.prepare("DELETE FROM platform_commercial_events").run()).toThrow(
      "commercial events are append-only"
    );
  });
});
