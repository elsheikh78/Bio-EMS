import { describe, expect, it, vi } from "vitest";
import { HttpSmsProvider } from "./http-sms.provider";

const envelope = {
  delivery: { idempotency_key: "delivery-1" },
  recipient: "+201000000000",
  payload: { event: "ALARM_TRIGGERED" },
} as never;

describe("HttpSmsProvider", () => {
  it("sends the approved envelope and returns the provider receipt", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ messageId: "sms-7" }), { status: 200 }));
    const provider = new HttpSmsProvider("pilot", "https://sms.test/send", "token", request);
    await expect(provider.send(envelope, new AbortController().signal)).resolves.toEqual({
      messageId: "sms-7",
    });
    expect(request).toHaveBeenCalledWith(
      "https://sms.test/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    );
  });

  it("fails closed for provider rejection or malformed receipts", async () => {
    const rejected = new HttpSmsProvider(
      "pilot",
      "https://sms.test/send",
      "token",
      vi.fn().mockResolvedValue(new Response("", { status: 503 }))
    );
    await expect(rejected.send(envelope, new AbortController().signal)).rejects.toThrow("rejected");
    const malformed = new HttpSmsProvider(
      "pilot",
      "https://sms.test/send",
      "token",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    );
    await expect(malformed.send(envelope, new AbortController().signal)).rejects.toThrow(
      "invalid receipt"
    );
  });
});
