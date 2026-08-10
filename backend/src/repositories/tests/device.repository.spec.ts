import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceRepository } from "../device.repository";

describe("DeviceRepository", () => {
  let database: Database.Database;
  let repository: DeviceRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.exec(`
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
        updated_at DATETIME
      );
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
});
