import { beforeEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";

const mocks = vi.hoisted(() => ({
  deviceRepository: {
    create: vi.fn(),
    getAll: vi.fn(),
    findByDeviceId: vi.fn(),
    updateMetadata: vi.fn(),
    transitionLifecycle: vi.fn(),
  },
  siteRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../../repositories/device.repository", () => ({
  DeviceRepository: vi.fn(() => mocks.deviceRepository),
}));

vi.mock("../../repositories/site.repository", () => ({
  SiteRepository: vi.fn(() => mocks.siteRepository),
}));

import { activateDevice, disableDevice } from "../device.service";
import { createDevice } from "../device.service";

const device = (status: string, activated: number) => ({
  id: 1,
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 4,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
  status,
  activated,
});

const createInput = {
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 4,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
};

const actualSqliteError = (kind: "unique" | "foreign-key"): Error & { code: string } => {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE sites (id INTEGER PRIMARY KEY);
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY,
      uuid TEXT UNIQUE,
      site_id INTEGER REFERENCES sites(id)
    );
    INSERT INTO sites (id) VALUES (1);
    INSERT INTO devices (id, uuid, site_id) VALUES (1, 'duplicate', 1);
  `);

  try {
    if (kind === "unique") {
      database.exec("INSERT INTO devices (id, uuid, site_id) VALUES (2, 'duplicate', 1)");
    } else {
      database.exec("INSERT INTO devices (id, uuid, site_id) VALUES (2, 'new', 999)");
    }
  } catch (error) {
    database.close();
    if (error instanceof Database.SqliteError) {
      return error;
    }
    throw error;
  }

  database.close();
  throw new Error("Expected SQLite constraint error");
};

const expectAppError = (operation: () => unknown, statusCode: number, code: string) => {
  expect(operation).toThrowError(
    expect.objectContaining({
      statusCode,
      code,
    })
  );
};

describe("Device lifecycle service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.siteRepository.findById.mockReturnValue({ id: 4, code: "CAIRO01", name: "Cairo" });
  });

  it("creates once when Site exists and returns the repository id", () => {
    mocks.deviceRepository.create.mockReturnValue(17);

    expect(createDevice(createInput)).toBe(17);
    expect(mocks.siteRepository.findById).toHaveBeenCalledWith(4);
    expect(mocks.deviceRepository.create).toHaveBeenCalledOnce();
    expect(mocks.deviceRepository.create).toHaveBeenCalledWith(createInput);
  });

  it("rejects create when Site is missing without invoking mutation", () => {
    mocks.siteRepository.findById.mockReturnValue(undefined);

    expectAppError(() => createDevice(createInput), 404, "SITE_NOT_FOUND");
    expect(mocks.deviceRepository.create).not.toHaveBeenCalled();
  });

  it.each(["uuid", "device_id"])("maps actual duplicate %s errors to conflict", () => {
    mocks.deviceRepository.create.mockImplementation(() => {
      throw actualSqliteError("unique");
    });

    expectAppError(() => createDevice(createInput), 409, "RESOURCE_ALREADY_EXISTS");
  });

  it("maps an actual foreign-key race failure to SITE_NOT_FOUND", () => {
    mocks.deviceRepository.create.mockImplementation(() => {
      throw actualSqliteError("foreign-key");
    });

    expectAppError(() => createDevice(createInput), 404, "SITE_NOT_FOUND");
  });

  it("rethrows unknown repository errors without converting them to client errors", () => {
    const unknown = new Error("unknown repository failure");
    mocks.deviceRepository.create.mockImplementation(() => {
      throw unknown;
    });

    expect(() => createDevice(createInput)).toThrow(unknown);
  });

  it("activates only pending/0 and returns the repository result", () => {
    const activated = device("active", 1);
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device("pending", 0));
    mocks.deviceRepository.transitionLifecycle.mockReturnValue(activated);

    expect(activateDevice("ZC-FW-001")).toEqual(activated);
    expect(mocks.siteRepository.findById).toHaveBeenCalledWith(4);
    expect(mocks.deviceRepository.transitionLifecycle).toHaveBeenCalledWith(
      "ZC-FW-001",
      "pending",
      0,
      "active",
      1
    );
  });

  it("disables only active/1 and returns the repository result without checking Site", () => {
    const disabled = device("disabled", 0);
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device("active", 1));
    mocks.deviceRepository.transitionLifecycle.mockReturnValue(disabled);

    expect(disableDevice("ZC-FW-001")).toEqual(disabled);
    expect(mocks.siteRepository.findById).not.toHaveBeenCalled();
    expect(mocks.deviceRepository.transitionLifecycle).toHaveBeenCalledWith(
      "ZC-FW-001",
      "active",
      1,
      "disabled",
      0
    );
  });

  it.each([
    ["activate", activateDevice],
    ["disable", disableDevice],
  ] as const)("returns DEVICE_NOT_FOUND when %s cannot find the device", (_name, operation) => {
    mocks.deviceRepository.findByDeviceId.mockReturnValue(undefined);

    expectAppError(() => operation("missing-device"), 404, "DEVICE_NOT_FOUND");
    expect(mocks.deviceRepository.transitionLifecycle).not.toHaveBeenCalled();
  });

  it("returns SITE_NOT_FOUND before activating a pending device", () => {
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device("pending", 0));
    mocks.siteRepository.findById.mockReturnValue(undefined);

    expectAppError(() => activateDevice("ZC-FW-001"), 404, "SITE_NOT_FOUND");
    expect(mocks.deviceRepository.transitionLifecycle).not.toHaveBeenCalled();
  });

  it("prioritizes state conflict over Site lookup for an invalid activate state", () => {
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device("active", 1));
    mocks.siteRepository.findById.mockReturnValue(undefined);

    expectAppError(() => activateDevice("ZC-FW-001"), 409, "DEVICE_STATE_CONFLICT");
    expect(mocks.siteRepository.findById).not.toHaveBeenCalled();
    expect(mocks.deviceRepository.transitionLifecycle).not.toHaveBeenCalled();
  });

  it.each([
    ["pending", 1],
    ["active", 1],
    ["disabled", 0],
  ])("rejects activate from %s/%i", (status, activated) => {
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device(status, activated));

    expectAppError(() => activateDevice("ZC-FW-001"), 409, "DEVICE_STATE_CONFLICT");
    expect(mocks.deviceRepository.transitionLifecycle).not.toHaveBeenCalled();
  });

  it.each([
    ["active", 0],
    ["pending", 0],
    ["disabled", 0],
  ])("rejects disable from %s/%i", (status, activated) => {
    mocks.deviceRepository.findByDeviceId.mockReturnValue(device(status, activated));

    expectAppError(() => disableDevice("ZC-FW-001"), 409, "DEVICE_STATE_CONFLICT");
    expect(mocks.deviceRepository.transitionLifecycle).not.toHaveBeenCalled();
  });

  it("maps a lost conditional-update race to DEVICE_STATE_CONFLICT when the row remains", () => {
    mocks.deviceRepository.findByDeviceId
      .mockReturnValueOnce(device("pending", 0))
      .mockReturnValueOnce(device("active", 1));
    mocks.deviceRepository.transitionLifecycle.mockReturnValue(undefined);

    expectAppError(() => activateDevice("ZC-FW-001"), 409, "DEVICE_STATE_CONFLICT");
  });

  it("maps a lost conditional-update race to DEVICE_NOT_FOUND when the row disappeared", () => {
    mocks.deviceRepository.findByDeviceId
      .mockReturnValueOnce(device("active", 1))
      .mockReturnValueOnce(undefined);
    mocks.deviceRepository.transitionLifecycle.mockReturnValue(undefined);

    expectAppError(() => disableDevice("ZC-FW-001"), 404, "DEVICE_NOT_FOUND");
  });
});
