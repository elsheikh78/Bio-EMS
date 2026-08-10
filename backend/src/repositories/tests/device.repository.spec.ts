import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceRepository } from "../device.repository";

describe("DeviceRepository", () => {
  let database: Database.Database;
  let repository: DeviceRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    database.exec(`
      CREATE TABLE sites (
        id INTEGER PRIMARY KEY
      );

      CREATE TABLE devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        device_id TEXT NOT NULL UNIQUE,
        site_id INTEGER NOT NULL,
        device_type TEXT NOT NULL,
        protocol TEXT NOT NULL,
        manufacturer TEXT,
        model TEXT,
        firmware_version TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        activated INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (site_id) REFERENCES sites(id)
      );

      INSERT INTO sites (id) VALUES (1);
    `);
    repository = new DeviceRepository(database);
    repository.create({
      uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
      device_id: "ZC-FW-001",
      site_id: 1,
      device_type: "zone-controller-firmware",
      protocol: "mqtt",
      manufacturer: "BIO-EMS",
      model: "ZC-16",
      firmware_version: "1.0.0",
    });
  });

  afterEach(() => database.close());

  it("resolves the textual device_id and returns undefined when it is missing", () => {
    expect(repository.findByDeviceId("ZC-FW-001")).toMatchObject({
      id: 1,
      device_id: "ZC-FW-001",
    });
    expect(repository.findByDeviceId("1")).toBeUndefined();
    expect(repository.findByDeviceId("missing-device")).toBeUndefined();
  });

  it("persists create metadata with pending/0 defaults", () => {
    expect(repository.findByDeviceId("ZC-FW-001")).toMatchObject({
      uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
      device_id: "ZC-FW-001",
      site_id: 1,
      device_type: "zone-controller-firmware",
      protocol: "mqtt",
      manufacturer: "BIO-EMS",
      model: "ZC-16",
      firmware_version: "1.0.0",
      status: "pending",
      activated: 0,
    });
  });

  it.each([
    ["uuid", { uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f", device_id: "ZC-FW-002" }],
    ["device_id", { uuid: "ee0ee6c1-dbe5-488c-a47a-cb2e8fb9a7bf", device_id: "ZC-FW-001" }],
  ])("raises the actual uniqueness constraint code for duplicate %s", (_field, identity) => {
    expect(() =>
      repository.create({
        ...identity,
        site_id: 1,
        device_type: "zone-controller-firmware",
        protocol: "mqtt",
      })
    ).toThrowError(
      expect.objectContaining({
        name: "SqliteError",
        code: "SQLITE_CONSTRAINT_UNIQUE",
      })
    );
  });

  it("raises the actual foreign-key constraint code for a missing Site", () => {
    expect(() =>
      repository.create({
        uuid: "ee0ee6c1-dbe5-488c-a47a-cb2e8fb9a7bf",
        device_id: "ZC-FW-002",
        site_id: 999,
        device_type: "zone-controller-firmware",
        protocol: "mqtt",
      })
    ).toThrowError(
      expect.objectContaining({
        name: "SqliteError",
        code: "SQLITE_CONSTRAINT_FOREIGNKEY",
      })
    );
  });

  it("updates one metadata field without changing omitted or protected fields", () => {
    const updated = repository.updateMetadata("ZC-FW-001", {
      model: "ZC-16B",
      ...({ status: "active", uuid: "forbidden" } as object),
    });

    expect(updated).toMatchObject({
      uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
      device_id: "ZC-FW-001",
      site_id: 1,
      device_type: "zone-controller-firmware",
      protocol: "mqtt",
      manufacturer: "BIO-EMS",
      model: "ZC-16B",
      firmware_version: "1.0.0",
      status: "pending",
      activated: 0,
    });
    expect(updated?.updated_at).toBeTruthy();
  });

  it("updates multiple metadata fields and returns the persisted row", () => {
    const updated = repository.updateMetadata("ZC-FW-001", {
      device_type: "gateway-firmware",
      protocol: "mqtt-v5",
      firmware_version: "1.1.0",
    });

    expect(updated).toMatchObject({
      device_type: "gateway-firmware",
      protocol: "mqtt-v5",
      firmware_version: "1.1.0",
      manufacturer: "BIO-EMS",
      model: "ZC-16",
    });
  });

  it("returns undefined when no device row is updated", () => {
    expect(repository.updateMetadata("missing-device", { model: "ZC-16B" })).toBeUndefined();
  });

  it("atomically activates pending/0 and returns the persisted row", () => {
    const activated = repository.transitionLifecycle("ZC-FW-001", "pending", 0, "active", 1);

    expect(activated).toMatchObject({
      device_id: "ZC-FW-001",
      status: "active",
      activated: 1,
      uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
      model: "ZC-16",
    });
    expect(activated?.updated_at).toBeTruthy();
  });

  it("atomically disables active/1 and returns the persisted row", () => {
    database
      .prepare("UPDATE devices SET status = 'active', activated = 1 WHERE device_id = ?")
      .run("ZC-FW-001");

    const disabled = repository.transitionLifecycle("ZC-FW-001", "active", 1, "disabled", 0);

    expect(disabled).toMatchObject({
      device_id: "ZC-FW-001",
      status: "disabled",
      activated: 0,
      protocol: "mqtt",
      manufacturer: "BIO-EMS",
    });
    expect(disabled?.updated_at).toBeTruthy();
  });

  it("does not mutate a device when the expected lifecycle is stale", () => {
    expect(repository.transitionLifecycle("ZC-FW-001", "active", 1, "disabled", 0)).toBeUndefined();
    expect(repository.findByDeviceId("ZC-FW-001")).toMatchObject({
      status: "pending",
      activated: 0,
    });
  });

  it("does not report transition success for a missing textual device_id", () => {
    expect(
      repository.transitionLifecycle("missing-device", "pending", 0, "active", 1)
    ).toBeUndefined();
  });
});
