import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration008 } from "../../../database/sqlite/migrations/008_create_notification_events";
import { NotificationEventRepository } from "./notification-event.repository";

describe("NotificationEventRepository", () => {
  let database: Database.Database;
  let repository: NotificationEventRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    migration008.up(database);
    repository = new NotificationEventRepository(database);
  });

  afterEach(() => database.close());

  it("persists a channel-independent event and restores its payload", () => {
    const result = repository.enqueue({
      eventType: "ALARM_TRIGGERED",
      sourceType: "ALARM",
      sourceId: "12",
      deduplicationKey: "alarm:12:triggered",
      payload: { severity: "CRITICAL" },
      occurredAt: "2026-08-17T10:00:00.000Z",
    });

    expect(result).toEqual({ id: 1, created: true });
    expect(repository.listPending()).toEqual([
      expect.objectContaining({
        id: 1,
        eventType: "ALARM_TRIGGERED",
        payload: { severity: "CRITICAL" },
        consumedAt: null,
      }),
    ]);
  });

  it("deduplicates retries without creating another event", () => {
    const event = {
      eventType: "DEVICE_OFFLINE" as const,
      sourceType: "DEVICE" as const,
      sourceId: "ZC-001",
      deduplicationKey: "device:ZC-001:offline:transition-1",
      payload: {},
      occurredAt: "2026-08-17T10:00:00.000Z",
    };

    expect(repository.enqueue(event)).toEqual({ id: 1, created: true });
    expect(repository.enqueue(event)).toEqual({ id: 1, created: false });
    expect(repository.listPending()).toHaveLength(1);
  });

  it("marks an event consumed once and leaves later events pending", () => {
    for (const id of [1, 2]) {
      repository.enqueue({
        eventType: "ALARM_RECOVERED",
        sourceType: "ALARM",
        sourceId: String(id),
        deduplicationKey: `alarm:${id}:recovered`,
        payload: {},
        occurredAt: "2026-08-17T10:00:00.000Z",
      });
    }

    expect(repository.markConsumed(1, "2026-08-17T10:01:00.000Z")).toBe(true);
    expect(repository.markConsumed(1, "2026-08-17T10:02:00.000Z")).toBe(false);
    expect(repository.listPending()).toEqual([expect.objectContaining({ id: 2 })]);
  });
});
