import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import { errorMiddleware } from "../../middleware/error.middleware";
import * as deviceService from "../../services/device.service";
import deviceRouter from "../device.route";

vi.mock("../../services/device.service", () => ({
  createDevice: vi.fn(),
  getDeviceByDeviceId: vi.fn(),
  getDevices: vi.fn(),
  updateDeviceMetadata: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/devices", deviceRouter);
app.use(errorMiddleware);

const validCreateRequest = {
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 1,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
  manufacturer: "BIO-EMS",
  model: "ZC-16",
  firmware_version: "1.0.0",
};

describe("Device REST API characterization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves the device list response contract", async () => {
    const devices = [
      {
        id: 7,
        ...validCreateRequest,
        status: "pending",
        activated: 0,
      },
    ];
    vi.mocked(deviceService.getDevices).mockReturnValue(devices);

    const response = await request(app).get("/api/v1/devices").expect(200);

    expect(response.body).toEqual(devices);
  });

  it("accepts a valid create request and preserves the create response contract", async () => {
    vi.mocked(deviceService.createDevice).mockReturnValue(12);

    const response = await request(app)
      .post("/api/v1/devices")
      .send({ ...validCreateRequest, device_id: "  ZC-FW-001  " })
      .expect(201);

    expect(deviceService.createDevice).toHaveBeenCalledWith(validCreateRequest);
    expect(response.body).toEqual({ success: true, id: 12 });
  });

  it.each([
    ["missing required fields", { uuid: validCreateRequest.uuid }],
    ["an invalid required field", { ...validCreateRequest, protocol: "" }],
    ["a malformed field type", { ...validCreateRequest, site_id: "1" }],
  ])("returns the stable validation error for %s", async (_case, body) => {
    const response = await request(app).post("/api/v1/devices").send(body).expect(400);

    expect(deviceService.createDevice).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
      },
    });
  });

  it("rejects unknown fields instead of passing an unvalidated body onward", async () => {
    const response = await request(app)
      .post("/api/v1/devices")
      .send({ ...validCreateRequest, status: "active", activated: 1 })
      .expect(400);

    expect(deviceService.createDevice).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
      },
    });
  });

  it("returns an existing device directly", async () => {
    const device = { id: 7, ...validCreateRequest, status: "pending", activated: 0 };
    vi.mocked(deviceService.getDeviceByDeviceId).mockReturnValue(device);

    const response = await request(app).get("/api/v1/devices/%20ZC-FW-001%20").expect(200);

    expect(deviceService.getDeviceByDeviceId).toHaveBeenCalledWith("ZC-FW-001");
    expect(response.body).toEqual(device);
  });

  it("returns the stable not-found error for a missing device", async () => {
    vi.mocked(deviceService.getDeviceByDeviceId).mockImplementation(() => {
      throw new AppError("Device not found", 404, "DEVICE_NOT_FOUND");
    });

    const response = await request(app).get("/api/v1/devices/missing-device").expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: "DEVICE_NOT_FOUND", message: "Device not found" },
    });
  });

  it("updates allowed metadata and returns the updated device directly", async () => {
    const update = { model: "ZC-16B" };
    const updated = { ...validCreateRequest, ...update };
    vi.mocked(deviceService.updateDeviceMetadata).mockReturnValue(updated);

    const response = await request(app)
      .patch("/api/v1/devices/ZC-FW-001")
      .send({ model: "  ZC-16B  " })
      .expect(200);

    expect(deviceService.updateDeviceMetadata).toHaveBeenCalledWith("ZC-FW-001", update);
    expect(response.body).toEqual(updated);
  });

  it("returns the stable not-found error when updating a missing device", async () => {
    vi.mocked(deviceService.updateDeviceMetadata).mockImplementation(() => {
      throw new AppError("Device not found", 404, "DEVICE_NOT_FOUND");
    });

    const response = await request(app)
      .patch("/api/v1/devices/missing-device")
      .send({ model: "ZC-16" })
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: { code: "DEVICE_NOT_FOUND", message: "Device not found" },
    });
  });

  it.each([
    ["an empty body", {}],
    ["a malformed field type", { firmware_version: 12 }],
    ["an internal field", { status: "active" }],
    ["an unknown field", { display_name: "Gateway" }],
  ])("rejects %s without invoking the update service", async (_case, body) => {
    const response = await request(app).patch("/api/v1/devices/ZC-FW-001").send(body).expect(400);

    expect(deviceService.updateDeviceMetadata).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
  });

  it("rejects invalid device params without invoking the read service", async () => {
    const response = await request(app).get("/api/v1/devices/%20").expect(400);

    expect(deviceService.getDeviceByDeviceId).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid route parameters" },
    });
  });
});
