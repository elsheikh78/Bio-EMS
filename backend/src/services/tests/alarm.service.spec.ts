import { beforeEach, describe, expect, it, vi } from "vitest";

const { acknowledgeAlarm, create, findActiveAlarm, getById, recoverAlarm } = vi.hoisted(() => ({
  acknowledgeAlarm: vi.fn(),
  create: vi.fn(),
  findActiveAlarm: vi.fn(),
  getById: vi.fn(),
  recoverAlarm: vi.fn(),
}));

const { publishAlarmAcknowledged, publishAlarmRecovered, publishAlarmTriggered } = vi.hoisted(
  () => ({
    publishAlarmAcknowledged: vi.fn(),
    publishAlarmRecovered: vi.fn(),
    publishAlarmTriggered: vi.fn(),
  })
);

vi.mock("../../repositories/alarm.repository", () => ({
  AlarmRepository: class {
    acknowledgeAlarm = acknowledgeAlarm;
    create = create;
    findActiveAlarm = findActiveAlarm;
    getById = getById;
    recoverAlarm = recoverAlarm;
    getActive = vi.fn();
    getAll = vi.fn();
  },
}));

vi.mock("../../modules/notification/notification.service", () => ({
  notificationService: {
    publishAlarmTriggered,
    publishAlarmRecovered,
    publishAlarmAcknowledged,
  },
}));

import { AppError } from "../../errors/app-error";
import * as alarmService from "../alarm.service";

describe("AlarmService notification events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes a trigger event only after creating a new Alarm", () => {
    findActiveAlarm.mockReturnValue(undefined);
    create.mockReturnValue(12);

    expect(
      alarmService.createAlarm({
        sensor_id: 3,
        type: "HIGH_TEMPERATURE",
        severity: "CRITICAL",
        status: "TRIGGERED",
        trigger_value: 9.2,
      })
    ).toBe(12);
    expect(publishAlarmTriggered).toHaveBeenCalledWith(
      expect.objectContaining({ alarmId: 12, sensorId: 3, occurredAt: expect.any(String) })
    );
  });

  it("does not publish another trigger event for an active Alarm", () => {
    findActiveAlarm.mockReturnValue({ id: 12 });

    expect(
      alarmService.createAlarm({
        sensor_id: 3,
        type: "HIGH_TEMPERATURE",
        severity: "CRITICAL",
        status: "TRIGGERED",
        trigger_value: 9.2,
      })
    ).toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(publishAlarmTriggered).not.toHaveBeenCalled();
  });

  it("publishes recovery only after the conditional state change succeeds", () => {
    recoverAlarm.mockReturnValueOnce(true).mockReturnValueOnce(false);

    alarmService.recoverAlarm(12);
    alarmService.recoverAlarm(12);

    expect(publishAlarmRecovered).toHaveBeenCalledTimes(1);
    expect(publishAlarmRecovered).toHaveBeenCalledWith(12, expect.any(String));
  });
});

describe("AlarmService acknowledgment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the authenticated User ID and succeeds only after one row changes", () => {
    getById.mockReturnValue({ id: 4, status: "TRIGGERED" });
    acknowledgeAlarm.mockReturnValue(true);

    expect(() => alarmService.acknowledgeAlarm(4, 9)).not.toThrow();
    expect(acknowledgeAlarm).toHaveBeenCalledWith(4, 9);
    expect(publishAlarmAcknowledged).toHaveBeenCalledWith(4, 9, expect.any(String));
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
    expect(publishAlarmAcknowledged).not.toHaveBeenCalled();
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
    expect(publishAlarmAcknowledged).not.toHaveBeenCalled();
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
    expect(publishAlarmAcknowledged).not.toHaveBeenCalled();
  });
});
