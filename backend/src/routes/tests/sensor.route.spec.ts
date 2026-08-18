import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";
import type { Sensor } from "../../entities/Sensor";
import * as calibrationService from "../../services/calibration.service";
import * as sensorService from "../../services/sensor.service";
import sensorRouter from "../sensor.route";

vi.mock("../../services/sensor.service", () => ({
  createSensor: vi.fn(),
  getSensors: vi.fn(),
}));

vi.mock("../../services/calibration.service", () => ({
  createCalibrationRecord: vi.fn(),
  getCalibrationHistory: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { id: 1, username: "admin", role: "ADMIN" };
  next();
});
app.use("/api/v1/sensors", sensorRouter);
app.use(errorMiddleware);

const validSensor = {
  uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
  room_id: 1,
  device_id: 1,
  channel: 0,
  code: "TEMP-01",
  name: "Cold room temperature",
  sensor_type: "TEMPERATURE",
  unit: "°C",
};

describe("Sensor REST API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts lifecycle and calibration foundation metadata", async () => {
    vi.mocked(sensorService.createSensor).mockReturnValue(14);
    const body = {
      ...validSensor,
      product_grade: "ADVANCED",
      hardware_model: "PT100 Class A",
      installation_date: "2026-08-17",
      calibration_status: "VALID",
      last_calibrated_at: "2026-08-17T09:00:00Z",
      calibration_due_at: "2027-08-17T09:00:00Z",
      calibration_offset: -0.15,
      certificate_reference: "CAL-2026-0042",
    } as const;

    const response = await request(app).post("/api/v1/sensors").send(body).expect(201);

    expect(sensorService.createSensor).toHaveBeenCalledWith(body);
    expect(response.body).toEqual({ id: 14 });
  });

  it("preserves backward-compatible defaults when new metadata is omitted", async () => {
    vi.mocked(sensorService.createSensor).mockReturnValue(15);

    await request(app).post("/api/v1/sensors").send(validSensor).expect(201);

    expect(sensorService.createSensor).toHaveBeenCalledWith(validSensor);
  });

  it.each([
    ["an unknown product grade", { product_grade: "PREMIUM" }],
    ["an unknown calibration status", { calibration_status: "CALIBRATED" }],
    ["a malformed installation date", { installation_date: "17/08/2026" }],
    [
      "a due date before the calibration date",
      {
        last_calibrated_at: "2026-08-17T09:00:00Z",
        calibration_due_at: "2026-08-16T09:00:00Z",
      },
    ],
    ["an internal identity field", { id: 99 }],
  ])("rejects %s", async (_case, metadata) => {
    const response = await request(app)
      .post("/api/v1/sensors")
      .send({ ...validSensor, ...metadata })
      .expect(400);

    expect(sensorService.createSensor).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
  });

  it("returns persisted lifecycle and calibration metadata", async () => {
    const sensors = [
      {
        id: 14,
        ...validSensor,
        product_grade: "STANDARD",
        calibration_status: "NOT_CALIBRATED",
        calibration_offset: 0,
      },
    ] satisfies Sensor[];
    vi.mocked(sensorService.getSensors).mockReturnValue(sensors);

    const response = await request(app).get("/api/v1/sensors").expect(200);

    expect(response.body).toEqual(sensors);
  });
});

describe("Calibration history REST API", () => {
  beforeEach(() => vi.clearAllMocks());

  const record = {
    id: 31,
    sensor_id: 14,
    sensor_uuid: validSensor.uuid,
    result: "PASS" as const,
    performed_at: "2026-08-17T09:00:00Z",
    due_at: "2027-08-17T09:00:00Z",
    offset: -0.15,
    certificate_reference: "CAL-2026-0042",
    notes: null,
    performed_by_user_id: 1,
    performed_by_username: "admin",
    created_at: "2026-08-17 09:01:00",
  };

  it("creates an actor-audited passing calibration record", async () => {
    vi.mocked(calibrationService.createCalibrationRecord).mockReturnValue(record);

    const body = {
      result: "PASS",
      performed_at: record.performed_at,
      due_at: record.due_at,
      offset: record.offset,
      certificate_reference: record.certificate_reference,
    };
    const response = await request(app)
      .post(`/api/v1/sensors/${validSensor.uuid}/calibrations`)
      .send(body)
      .expect(201);

    expect(calibrationService.createCalibrationRecord).toHaveBeenCalledWith(
      validSensor.uuid,
      body,
      1
    );
    expect(response.body).toEqual(record);
  });

  it("returns immutable history in the service-provided order", async () => {
    vi.mocked(calibrationService.getCalibrationHistory).mockReturnValue([record]);

    const response = await request(app)
      .get(`/api/v1/sensors/${validSensor.uuid}/calibrations`)
      .expect(200);

    expect(calibrationService.getCalibrationHistory).toHaveBeenCalledWith(validSensor.uuid);
    expect(response.body).toEqual([record]);
  });

  it("supports persisted legacy Sensor identifiers during calibration transition", async () => {
    const legacySensorUuid = "sensor-temp-001-uuid";
    vi.mocked(calibrationService.getCalibrationHistory).mockReturnValue([]);

    await request(app).get(`/api/v1/sensors/${legacySensorUuid}/calibrations`).expect(200);

    expect(calibrationService.getCalibrationHistory).toHaveBeenCalledWith(legacySensorUuid);
  });

  it.each([
    ["a malformed Sensor UUID", "/api/v1/sensors/not-a-uuid/calibrations", {}],
    [
      "a passing record without due date and offset",
      `/api/v1/sensors/${validSensor.uuid}/calibrations`,
      { result: "PASS", performed_at: record.performed_at },
    ],
    [
      "a reversed due date",
      `/api/v1/sensors/${validSensor.uuid}/calibrations`,
      {
        result: "PASS",
        performed_at: record.performed_at,
        due_at: "2026-08-16T09:00:00Z",
        offset: 0,
      },
    ],
    [
      "an unknown field",
      `/api/v1/sensors/${validSensor.uuid}/calibrations`,
      { result: "FAIL", performed_at: record.performed_at, approved: true },
    ],
  ])("rejects %s", async (_case, path, body) => {
    await request(app).post(path).send(body).expect(400);
    expect(calibrationService.createCalibrationRecord).not.toHaveBeenCalled();
  });
});
