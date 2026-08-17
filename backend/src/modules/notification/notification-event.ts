export const NOTIFICATION_EVENT_TYPES = [
  "ALARM_TRIGGERED",
  "ALARM_RECOVERED",
  "ALARM_ACKNOWLEDGED",
  "DEVICE_STALE",
  "DEVICE_OFFLINE",
  "DEVICE_ONLINE",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];
export type NotificationSourceType = "ALARM" | "DEVICE";

export interface NotificationEventInput {
  eventType: NotificationEventType;
  sourceType: NotificationSourceType;
  sourceId: string;
  deduplicationKey: string;
  payload: Readonly<Record<string, unknown>>;
  occurredAt: string;
}

export interface NotificationEvent extends NotificationEventInput {
  id: number;
  consumedAt: string | null;
  createdAt: string;
}

export interface NotificationChannelAdapter {
  readonly channel: string;
  deliver(event: NotificationEvent): Promise<void>;
}
