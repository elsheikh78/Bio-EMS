import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationEventRepository } from "./notification-event.repository";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  const enqueue = vi.fn();
  const service = new NotificationService({ enqueue } as unknown as NotificationEventRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    enqueue.mockReturnValue({ id: 1, created: true });
  });

  it("maps Alarm trigger evidence to a stable channel-independent contract", () => {
    service.publishAlarmTriggered({
      alarmId: 8,
      sensorId: 3,
      alarmType: "HIGH_TEMPERATURE",
      severity: "CRITICAL",
      triggerValue: 9.2,
      occurredAt: "2026-08-17T10:00:00.000Z",
    });

    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ALARM_TRIGGERED",
        sourceType: "ALARM",
        sourceId: "8",
        deduplicationKey: "alarm:8:triggered",
      })
    );
  });

  it.each(["STALE", "OFFLINE", "ONLINE"] as const)(
    "maps Device %s transitions without selecting a delivery channel",
    (status) => {
      service.publishDeviceCommunication({
        deviceId: "ZC-001",
        status,
        occurredAt: "2026-08-17T10:00:00.000Z",
        lastSeenAt: "2026-08-17T09:55:00.000Z",
      });

      expect(enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: `DEVICE_${status}`,
          sourceType: "DEVICE",
          sourceId: "ZC-001",
        })
      );
    }
  );

  it("rejects an invalid occurrence timestamp before persistence", () => {
    expect(() => service.publishAlarmRecovered(2, "not-a-timestamp")).toThrowError(TypeError);
    expect(enqueue).not.toHaveBeenCalled();
  });
});
