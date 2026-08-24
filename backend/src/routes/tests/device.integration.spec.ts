import Database from "better-sqlite3";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../database/sqlite/client", async () => {
  const { default: SqliteDatabase } = await import("better-sqlite3");
  const sqlite = new SqliteDatabase(":memory:");
  sqlite.pragma("foreign_keys = ON");
  return { sqlite };
});

import { sqlite } from "../../../database/sqlite/client";
import { createTables } from "../../../database/sqlite/schema";
import { migration010 } from "../../../database/sqlite/migrations/010_create_audit_events";
import { errorMiddleware } from "../../middleware/error.middleware";
import deviceRouter from "../device.route";

const database = sqlite as Database.Database;

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { id: 1, username: "admin", role: "ADMIN" };
  next();
});
app.use("/api/v1/devices", deviceRouter);
app.use(errorMiddleware);

const validDevice = {
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 1,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
  manufacturer: "BIO-EMS",
  model: "ZC-16",
  firmware_version: "1.0.0",
};

const expectSafeError = (body: unknown) => {
  expect(JSON.stringify(body)).not.toMatch(
    /sqlite|constraint|foreign key|insert|select|stack|zod/i
  );
};

const expectStateConflict = (body: unknown) => {
  expect(body).toEqual({
    success: false,
    error: {
      code: "DEVICE_STATE_CONFLICT",
      message: "Device state transition not allowed",
    },
  });
  expectSafeError(body);
};

const persistedDevice = () =>
  database.prepare("SELECT * FROM devices WHERE device_id = ?").get(validDevice.device_id) as
    Record<string, unknown> | undefined;

describe("Device REST integration", () => {
  beforeAll(() => {
    expect(database.pragma("foreign_keys", { simple: true })).toBe(1);
    createTables();
  });

  beforeEach(() => {
    database.exec(`
      DROP TABLE IF EXISTS audit_events;
      DELETE FROM devices;
      DELETE FROM sites;
      DELETE FROM sqlite_sequence WHERE name IN ('devices', 'sites');
      INSERT INTO sites (id, code, name) VALUES (1, 'CAIRO01', 'Cairo');
    `);
    migration010.up(database);
  });

  afterAll(() => database.close());

  const createDevice = (input = validDevice) => request(app).post("/api/v1/devices").send(input);

  it("creates, lists, and reads the same pending Device through the real stack", async () => {
    const created = await createDevice().expect(201);
    expect(created.body).toEqual({ success: true, id: 1 });

    const list = await request(app).get("/api/v1/devices").expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ ...validDevice, status: "pending", activated: 0 });

    const read = await request(app).get("/api/v1/devices/ZC-FW-001").expect(200);
    expect(read.body).toEqual(list.body[0]);
    expect(persistedDevice()).toMatchObject({ ...validDevice, status: "pending", activated: 0 });
  });

  it("rejects lifecycle-controlled create fields without inserting a row", async () => {
    const response = await createDevice({
      ...validDevice,
      status: "active",
      activated: 1,
    } as typeof validDevice).expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expectSafeError(response.body);
    expect(persistedDevice()).toBeUndefined();
  });

  it.each([
    ["UUID", { uuid: validDevice.uuid, device_id: "ZC-FW-002" }],
    [
      "device_id",
      { uuid: "ee0ee6c1-dbe5-488c-a47a-cb2e8fb9a7bf", device_id: validDevice.device_id },
    ],
  ])("maps duplicate %s to the stable conflict without a second row", async (_field, identity) => {
    await createDevice().expect(201);

    const response = await createDevice({ ...validDevice, ...identity }).expect(409);
    expect(response.body).toEqual({
      success: false,
      error: { code: "RESOURCE_ALREADY_EXISTS", message: "Resource already exists" },
    });
    expectSafeError(response.body);
    expect(database.prepare("SELECT COUNT(*) AS count FROM devices").get()).toEqual({ count: 1 });
  });

  it("rejects a missing Site without inserting a Device or leaking SQLite details", async () => {
    const response = await createDevice({ ...validDevice, site_id: 999 }).expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: "SITE_NOT_FOUND", message: "Site not found" },
    });
    expectSafeError(response.body);
    expect(persistedDevice()).toBeUndefined();
  });

  it("updates only metadata and persists protected fields unchanged", async () => {
    await createDevice().expect(201);

    const response = await request(app)
      .patch("/api/v1/devices/ZC-FW-001")
      .send({ model: "ZC-16B", firmware_version: "1.1.0" })
      .expect(200);

    expect(response.body).toMatchObject({
      ...validDevice,
      model: "ZC-16B",
      firmware_version: "1.1.0",
      status: "pending",
      activated: 0,
    });
    expect(persistedDevice()).toMatchObject(response.body);
  });

  it.each([
    ["empty payload", {}],
    ["lifecycle fields", { status: "active", activated: 1 }],
    ["identity fields", { uuid: "ee0ee6c1-dbe5-488c-a47a-cb2e8fb9a7bf", device_id: "changed" }],
    ["unknown fields", { display_name: "Gateway" }],
  ])("rejects update %s without mutating the row", async (_case, update) => {
    await createDevice().expect(201);
    const before = persistedDevice();

    const response = await request(app).patch("/api/v1/devices/ZC-FW-001").send(update).expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expectSafeError(response.body);
    expect(persistedDevice()).toEqual(before);
  });

  it("persists the complete pending to active to disabled lifecycle", async () => {
    await createDevice().expect(201);

    const activated = await request(app).post("/api/v1/devices/ZC-FW-001/activate").expect(200);
    expect(activated.body).toMatchObject({ status: "active", activated: 1 });
    expect(persistedDevice()).toMatchObject({ status: "active", activated: 1 });

    const disabled = await request(app).post("/api/v1/devices/ZC-FW-001/disable").expect(200);
    expect(disabled.body).toMatchObject({ status: "disabled", activated: 0 });
    expect(persistedDevice()).toMatchObject({ status: "disabled", activated: 0 });

    const reactivated = await request(app).post("/api/v1/devices/ZC-FW-001/activate").expect(200);
    expect(reactivated.body).toMatchObject({ status: "active", activated: 1 });
    expect(persistedDevice()).toMatchObject({ status: "active", activated: 1 });
    expect(
      database
        .prepare("SELECT action, target_id, site_id, result FROM audit_events ORDER BY rowid")
        .all()
    ).toEqual([
      {
        action: "DEVICE.ACTIVATED_OR_REACTIVATED",
        target_id: "ZC-FW-001",
        site_id: 1,
        result: "SUCCESS",
      },
      {
        action: "DEVICE.DISABLED",
        target_id: "ZC-FW-001",
        site_id: 1,
        result: "SUCCESS",
      },
      {
        action: "DEVICE.ACTIVATED_OR_REACTIVATED",
        target_id: "ZC-FW-001",
        site_id: 1,
        result: "SUCCESS",
      },
    ]);
  });

  it("rejects repeated and out-of-order transitions without mutating the row", async () => {
    await createDevice().expect(201);

    const prematureDisable = await request(app)
      .post("/api/v1/devices/ZC-FW-001/disable")
      .expect(409);
    expectStateConflict(prematureDisable.body);
    expect(persistedDevice()).toMatchObject({ status: "pending", activated: 0 });

    await request(app).post("/api/v1/devices/ZC-FW-001/activate").expect(200);
    const repeatedActivate = await request(app)
      .post("/api/v1/devices/ZC-FW-001/activate")
      .expect(409);
    expectStateConflict(repeatedActivate.body);
    expect(persistedDevice()).toMatchObject({ status: "active", activated: 1 });

    await request(app).post("/api/v1/devices/ZC-FW-001/disable").expect(200);
    const repeatedDisable = await request(app)
      .post("/api/v1/devices/ZC-FW-001/disable")
      .expect(409);
    expectStateConflict(repeatedDisable.body);
    expect(persistedDevice()).toMatchObject({ status: "disabled", activated: 0 });
  });

  it.each([
    ["GET", "/api/v1/devices/UNKNOWN"],
    ["PATCH", "/api/v1/devices/UNKNOWN"],
    ["POST", "/api/v1/devices/UNKNOWN/activate"],
    ["POST", "/api/v1/devices/UNKNOWN/disable"],
  ])("returns the stable 404 for %s %s", async (method, path) => {
    const agent = request(app);
    const operation =
      method === "GET"
        ? agent.get(path)
        : method === "PATCH"
          ? agent.patch(path).send({ model: "ZC-16B" })
          : agent.post(path);
    const response = await operation.expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: "DEVICE_NOT_FOUND", message: "Device not found" },
    });
    expectSafeError(response.body);
  });

  it("returns SITE_NOT_FOUND when an existing pending Device loses its Site", async () => {
    await createDevice().expect(201);
    database.pragma("foreign_keys = OFF");
    database.prepare("DELETE FROM sites WHERE id = 1").run();
    database.pragma("foreign_keys = ON");

    const response = await request(app).post("/api/v1/devices/ZC-FW-001/activate").expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: "SITE_NOT_FOUND", message: "Site not found" },
    });
    expectSafeError(response.body);
    expect(persistedDevice()).toMatchObject({ status: "pending", activated: 0 });
  });

  it("rejects unsupported list query parameters while preserving the empty-query contract", async () => {
    await createDevice().expect(201);
    await request(app).get("/api/v1/devices").expect(200);

    const response = await request(app).get("/api/v1/devices?unsupported=value").expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" },
    });
    expectSafeError(response.body);
    expect(database.prepare("SELECT COUNT(*) AS count FROM devices").get()).toEqual({ count: 1 });
  });
});
