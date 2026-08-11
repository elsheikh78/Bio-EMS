import { beforeEach, describe, expect, it, vi } from "vitest";

const { acknowledgeAlarm, getById } = vi.hoisted(() => ({
  acknowledgeAlarm: vi.fn(),
  getById: vi.fn(),
}));

vi.mock("../../repositories/alarm.repository", () => ({
  AlarmRepository: class {
    acknowledgeAlarm = acknowledgeAlarm;
    getById = getById;
  },
}));

import { AppError } from "../../errors/app-error";
import * as alarmService from "../alarm.service";

describe("AlarmService acknowledgment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the authenticated User ID and succeeds only after one row changes", () => {
    getById.mockReturnValue({ id: 4, status: "TRIGGERED" });
    acknowledgeAlarm.mockReturnValue(true);

    expect(() => alarmService.acknowledgeAlarm(4, 9)).not.toThrow();
    expect(acknowledgeAlarm).toHaveBeenCalledWith(4, 9);
  });

  it("preserves the missing Alarm contract", () => {
    getById.mockReturnValue(undefined);

    expect(() => alarmService.acknowledgeAlarm(4, 9)).toThrowError(
      expect.objectContaining({
        statusCode: 404,
        code: "ALARM_NOT_FOUND",
      } satisfies Partial<AppError>)
    );
    expect(acknowledgeAlarm).not.toHaveBeenCalled();
  });

  it("preserves the invalid state contract", () => {
    getById.mockReturnValue({ id: 4, status: "ACKNOWLEDGED" });

    expect(() => alarmService.acknowledgeAlarm(4, 9)).toThrowError(
      expect.objectContaining({
        statusCode: 409,
        code: "INVALID_ALARM_STATE",
      } satisfies Partial<AppError>)
    );
    expect(acknowledgeAlarm).not.toHaveBeenCalled();
  });

  it("maps a zero-change race to the existing invalid state contract", () => {
    getById.mockReturnValue({ id: 4, status: "TRIGGERED" });
    acknowledgeAlarm.mockReturnValue(false);

    expect(() => alarmService.acknowledgeAlarm(4, 9)).toThrowError(
      expect.objectContaining({
        statusCode: 409,
        code: "INVALID_ALARM_STATE",
      } satisfies Partial<AppError>)
    );
  });
});
