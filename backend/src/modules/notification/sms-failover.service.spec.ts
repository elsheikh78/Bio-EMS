import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationEventInput } from "./notification-event";
import { SmsFailoverGateway } from "./sms-failover.contract";
import { SmsFailoverService } from "./sms-failover.service";

const criticalEvent: NotificationEventInput = {
  eventType: "ALARM_TRIGGERED",
  sourceType: "ALARM",
  sourceId: "12",
  deduplicationKey: "alarm:12:triggered",
  payload: { severity: "CRITICAL", sensorId: 7 },
  occurredAt: "2026-08-17T10:00:00.000Z",
};

describe("SmsFailoverService", () => {
  const send = vi.fn();
  const service = new SmsFailoverService({ send } as SmsFailoverGateway);

  beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue({
      providerMessageId: "provider-1",
      acceptedAt: "2026-08-17T10:00:01.000Z",
    });
  });

  it("does not call the gateway when policy rejects SMS", async () => {
    await expect(
      service.attempt({
        event: criticalEvent,
        primaryCommunication: "AVAILABLE",
        recipient: "+201001234567",
      })
    ).resolves.toEqual({ status: "NOT_ELIGIBLE", reason: "PRIMARY_AVAILABLE" });
    expect(send).not.toHaveBeenCalled();
  });

  it("passes a stable idempotency key to the gateway for eligible retries", async () => {
    const request = {
      event: criticalEvent,
      primaryCommunication: "UNAVAILABLE" as const,
      recipient: "+201001234567",
    };

    await service.attempt(request);
    await service.attempt(request);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^sms:alarm:12:triggered:/) })
    );
    expect(send.mock.calls[1][0].idempotencyKey).toBe(send.mock.calls[0][0].idempotencyKey);
    expect(send.mock.calls[0][0].idempotencyKey).not.toContain(request.recipient);
  });

  it("fails closed before the gateway when an eligible recipient is not E.164", async () => {
    await expect(
      service.attempt({
        event: criticalEvent,
        primaryCommunication: "UNAVAILABLE",
        recipient: "01001234567",
      })
    ).rejects.toThrowError(TypeError);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns a provider-neutral failure without exposing gateway errors", async () => {
    send.mockRejectedValue(new Error("provider credential leaked detail"));

    const result = await service.attempt({
      event: criticalEvent,
      primaryCommunication: "UNAVAILABLE",
      recipient: "+201001234567",
    });

    expect(result).toEqual({
      status: "FAILED",
      idempotencyKey: expect.stringMatching(/^sms:alarm:12:triggered:/),
    });
    expect(JSON.stringify(result)).not.toContain("credential");
  });
});
