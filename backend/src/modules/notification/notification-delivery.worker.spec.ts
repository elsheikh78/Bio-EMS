import { describe, expect, it, vi } from "vitest";
import { NotificationDeliveryWorker } from "./notification-delivery.worker";

const delivery = {
  id: 7,
  channel: "SMS",
  claim_token: "claim-1",
  attempt_count: 0,
} as const;

function repository() {
  return {
    claimDue: vi.fn().mockReturnValue(delivery),
    envelope: vi.fn().mockReturnValue({ delivery, recipient: "+201000000000", payload: {} }),
    startAttempt: vi.fn().mockReturnValue(11),
    finishAttempt: vi.fn(),
    recordSent: vi.fn(),
    recordFailure: vi.fn(),
  };
}

describe("NotificationDeliveryWorker", () => {
  it("records a provider receipt and completes the claimed job", async () => {
    const repo = repository();
    const provider = {
      name: "PILOT_SMS",
      channel: "SMS" as const,
      send: vi.fn().mockResolvedValue({ messageId: "sms-1" }),
    };
    const worker = new NotificationDeliveryWorker(repo as never, [provider], 100);

    await expect(worker.tick(new Date("2026-08-31T12:00:00.000Z"))).resolves.toBe("SENT");
    expect(repo.finishAttempt).toHaveBeenCalledWith(11, "SENT", expect.any(String), "sms-1");
    expect(repo.recordSent).toHaveBeenCalledWith(7, "claim-1", expect.any(String), "sms-1");
  });

  it("schedules a retry without exposing the recipient when delivery fails", async () => {
    const repo = repository();
    const provider = {
      name: "PILOT_SMS",
      channel: "SMS" as const,
      send: vi.fn().mockRejectedValue(new Error("secret provider response")),
    };
    const worker = new NotificationDeliveryWorker(repo as never, [provider], 100);

    await expect(worker.tick(new Date("2026-08-31T12:00:00.000Z"))).resolves.toBe("RETRY");
    expect(repo.finishAttempt).toHaveBeenCalledWith(
      11,
      "FAILED",
      expect.any(String),
      undefined,
      "PROVIDER_FAILED"
    );
    expect(repo.recordFailure).toHaveBeenCalledWith(
      7,
      "claim-1",
      expect.any(String),
      "PROVIDER_FAILED",
      "2026-08-31T12:00:30.000Z"
    );
  });
});
