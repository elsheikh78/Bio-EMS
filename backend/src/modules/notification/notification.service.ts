import { NotificationEventInput } from "./notification-event";
import { NotificationEventRepository } from "./notification-event.repository";
import { z } from "zod";

const isoTimestampSchema = z.iso.datetime({ offset: true });

export class NotificationService {
  constructor(private readonly repository = new NotificationEventRepository()) {}

  publish(event: NotificationEventInput): { id: number; created: boolean } {
    assertIsoTimestamp(event.occurredAt);
    return this.repository.enqueue(event);
  }

  publishAlarmTriggered(input: {
    alarmId: number;
    sensorId: number;
    alarmType: string;
    severity: string;
    triggerValue: number;
    occurredAt: string;
  }): { id: number; created: boolean } {
    return this.publish({
      eventType: "ALARM_TRIGGERED",
      sourceType: "ALARM",
      sourceId: String(input.alarmId),
      deduplicationKey: `alarm:${input.alarmId}:triggered`,
      payload: input,
      occurredAt: input.occurredAt,
    });
  }

  publishAlarmRecovered(alarmId: number, occurredAt: string): { id: number; created: boolean } {
    return this.publish({
      eventType: "ALARM_RECOVERED",
      sourceType: "ALARM",
      sourceId: String(alarmId),
      deduplicationKey: `alarm:${alarmId}:recovered`,
      payload: { alarmId },
      occurredAt,
    });
  }

  publishAlarmAcknowledged(
    alarmId: number,
    userId: number,
    occurredAt: string
  ): { id: number; created: boolean } {
    return this.publish({
      eventType: "ALARM_ACKNOWLEDGED",
      sourceType: "ALARM",
      sourceId: String(alarmId),
      deduplicationKey: `alarm:${alarmId}:acknowledged`,
      payload: { alarmId, userId },
      occurredAt,
    });
  }

  publishDeviceCommunication(input: {
    deviceId: string;
    status: "STALE" | "OFFLINE" | "ONLINE";
    occurredAt: string;
    lastSeenAt: string | null;
  }): { id: number; created: boolean } {
    const eventType = `DEVICE_${input.status}` as const;
    return this.publish({
      eventType,
      sourceType: "DEVICE",
      sourceId: input.deviceId,
      deduplicationKey: `device:${input.deviceId}:${input.status.toLowerCase()}:${input.occurredAt}`,
      payload: input,
      occurredAt: input.occurredAt,
    });
  }
}

function assertIsoTimestamp(value: string): void {
  if (!isoTimestampSchema.safeParse(value).success) {
    throw new TypeError("Notification event occurredAt must be an ISO timestamp");
  }
}

export const notificationService = new NotificationService();
