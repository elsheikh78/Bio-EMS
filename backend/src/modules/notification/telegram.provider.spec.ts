import { describe, expect, it, vi } from "vitest";
import { TelegramProvider } from "./telegram.provider";

const envelope = {
  delivery: { severity: "CRITICAL", idempotency_key: "d1" },
  recipient: "-1001234567890",
  payload: {
    alarmType: "HIGH_TEMPERATURE",
    triggerValue: 9.2,
    occurredAt: "2026-09-03T10:00:00Z",
  },
} as never;

describe("TelegramProvider", () => {
  it("sends an alarm message and returns Telegram's receipt", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 })
      );
    const provider = new TelegramProvider(
      "TELEGRAM_BOT",
      "https://api.telegram.org/bot123:token/sendMessage",
      request
    );

    await expect(provider.send(envelope, new AbortController().signal)).resolves.toEqual({
      messageId: "42",
    });
    const options = request.mock.calls[0]?.[1] as RequestInit;
    expect(options.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(String(options.body))).toMatchObject({
      chat_id: "-1001234567890",
      text: expect.stringContaining("HIGH_TEMPERATURE"),
    });
  });

  it("fails closed on rejection or a missing provider receipt", async () => {
    const rejected = new TelegramProvider(
      "TELEGRAM_BOT",
      "https://api.telegram.org/test",
      vi.fn().mockResolvedValue(new Response("{}", { status: 400 }))
    );
    await expect(rejected.send(envelope, new AbortController().signal)).rejects.toThrow("rejected");

    const malformed = new TelegramProvider(
      "TELEGRAM_BOT",
      "https://api.telegram.org/test",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    );
    await expect(malformed.send(envelope, new AbortController().signal)).rejects.toThrow(
      "invalid receipt"
    );
  });
});
