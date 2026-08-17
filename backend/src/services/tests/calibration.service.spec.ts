import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, listBySensorUuid } = vi.hoisted(() => ({
  create: vi.fn(),
  listBySensorUuid: vi.fn(),
}));

vi.mock("../../repositories/calibration.repository", () => ({
  CalibrationRepository: class {
    create = create;
    listBySensorUuid = listBySensorUuid;
  },
}));

import { createCalibrationRecord, getCalibrationHistory } from "../calibration.service";

const sensorUuid = "8ae946c2-1424-44e8-b98d-ae2fd2f2273e";
const input = { result: "FAIL" as const, performed_at: "2026-08-17T09:00:00Z" };

describe("Calibration service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the persisted actor-audited record", () => {
    const record = {
      id: 1,
      sensor_id: 4,
      sensor_uuid: sensorUuid,
      result: "FAIL" as const,
      performed_at: input.performed_at,
      due_at: null,
      offset: null,
      certificate_reference: null,
      notes: null,
      performed_by_user_id: 7,
      performed_by_username: "admin",
      created_at: "2026-08-17 09:01:00",
    };
    create.mockReturnValue(record);

    expect(createCalibrationRecord(sensorUuid, input, 7)).toEqual(record);
    expect(create).toHaveBeenCalledWith(sensorUuid, input, 7);
  });

  it.each([
    ["create", () => createCalibrationRecord(sensorUuid, input, 7), create],
    ["history", () => getCalibrationHistory(sensorUuid), listBySensorUuid],
  ])("returns the stable Sensor-not-found error from %s", (_case, operation, repositoryMethod) => {
    repositoryMethod.mockReturnValue(undefined);

    expect(operation).toThrow(
      expect.objectContaining({
        statusCode: 404,
        code: "SENSOR_NOT_FOUND",
        message: "Sensor not found",
      })
    );
  });
});
