import { describe, expect, it, vi } from "vitest";
import type { NotificationEvent } from "./notification-event";
import { NotificationEscalationOrchestrator } from "./notification-escalation.orchestrator";

const triggered: NotificationEvent = {
  id: 1,
  eventType: "ALARM_TRIGGERED",
  sourceType: "ALARM",
  sourceId: "9",
  deduplicationKey: "alarm:9:triggered",
  payload: {},
  occurredAt: "2026-08-31T12:00:00.000Z",
  consumedAt: null,
  createdAt: "2026-08-31T12:00:00.000Z",
};

describe("NotificationEscalationOrchestrator", () => {
  it("immediately escalates Main health to every critical recipient and repeats in five-minute windows", () => {
    const get = vi
      .fn()
      .mockReturnValue({ status: "TRIGGERED", triggeredAt: "2026-08-31T12:00:00Z", siteId: 2 });
    const event = {
      ...triggered,
      sourceType: "DEVICE",
      sourceId: "health:12",
      payload: { systemHealthId: 12 },
    };
    const events = { listPending: () => [event], markConsumed: vi.fn() };
    const deliveries = {
      create: vi.fn().mockReturnValue({ created: true }),
      cancelOpenForSource: vi.fn(),
    };
    const policies = { resolveDue: vi.fn() };
    const recipients = { resolveEligible: vi.fn().mockReturnValue([{ id: 4 }, { id: 5 }]) };
    const orchestrator = new NotificationEscalationOrchestrator(
      { prepare: () => ({ get }) } as never,
      events as never,
      deliveries as never,
      policies as never,
      recipients as never
    );
    expect(orchestrator.tick(new Date("2026-08-31T12:00:00Z"))).toBe(8);
    expect(policies.resolveDue).not.toHaveBeenCalled();
    expect(deliveries.create).toHaveBeenCalledWith(
      expect.objectContaining({ idempotency_key: "health:12:0:4:WHATSAPP", severity: "CRITICAL" })
    );
    orchestrator.tick(new Date("2026-08-31T12:05:00Z"));
    expect(deliveries.create).toHaveBeenCalledWith(
      expect.objectContaining({ idempotency_key: "health:12:1:4:WHATSAPP" })
    );
    get.mockReturnValue({ status: "ACKNOWLEDGED", triggeredAt: "2026-08-31T12:00:00Z", siteId: 2 });
    deliveries.create.mockClear();
    expect(orchestrator.tick(new Date("2026-08-31T12:06:00Z"))).toBe(0);
    expect(deliveries.create).not.toHaveBeenCalled();
    expect(deliveries.cancelOpenForSource).toHaveBeenCalledWith(
      "DEVICE",
      "health:12",
      "2026-08-31T12:06:00.000Z"
    );
    expect(events.markConsumed).toHaveBeenCalledWith(1, "2026-08-31T12:06:00.000Z");
  });
  it("creates only configured due deliveries and remains idempotent", () => {
    const database = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ status: "TRIGGERED", severity: "CRITICAL", siteId: 2 }),
      }),
    };
    const events = { listPending: vi.fn().mockReturnValue([triggered]), markConsumed: vi.fn() };
    const deliveries = {
      create: vi.fn().mockReturnValue({ created: true }),
      cancelOpenForSource: vi.fn(),
    };
    const policies = {
      resolveDue: vi
        .fn()
        .mockReturnValue([
          { id: 3, steps: [{ position: 1, recipient_role: "QUALITY", channels: ["SMS"] }] },
        ]),
    };
    const recipients = {
      resolveEligible: vi.fn().mockReturnValue([
        { id: 4, role: "QUALITY" },
        { id: 5, role: "WAREHOUSE_MANAGER" },
      ]),
    };
    const orchestrator = new NotificationEscalationOrchestrator(
      database as never,
      events as never,
      deliveries as never,
      policies as never,
      recipients as never
    );

    expect(orchestrator.tick(new Date("2026-08-31T12:05:00.000Z"))).toBe(1);
    expect(policies.resolveDue).toHaveBeenCalledWith(2, "CRITICAL", 300);
    expect(deliveries.create).toHaveBeenCalledTimes(1);
    expect(deliveries.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: 4,
        channel: "SMS",
        idempotency_key: "delivery:1:3:1:4:SMS",
      })
    );
  });

  it("cancels open delivery and consumes Alarm events on acknowledgement", () => {
    const acknowledged = { ...triggered, id: 2, eventType: "ALARM_ACKNOWLEDGED" };
    const run = vi.fn().mockReturnValue({ changes: 2 });
    const database = { prepare: vi.fn().mockReturnValue({ run }) };
    const events = { listPending: vi.fn().mockReturnValue([acknowledged]) };
    const deliveries = { cancelOpenForSource: vi.fn() };
    const orchestrator = new NotificationEscalationOrchestrator(
      database as never,
      events as never,
      deliveries as never,
      {} as never,
      {} as never
    );

    expect(orchestrator.tick(new Date("2026-08-31T12:01:00.000Z"))).toBe(0);
    expect(deliveries.cancelOpenForSource).toHaveBeenCalledWith(
      "ALARM",
      "9",
      "2026-08-31T12:01:00.000Z"
    );
    expect(run).toHaveBeenCalledWith("2026-08-31T12:01:00.000Z", "9");
  });
});
