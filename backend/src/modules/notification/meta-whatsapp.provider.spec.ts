import { describe, expect, it, vi } from "vitest";
import { MetaWhatsappProvider } from "./meta-whatsapp.provider";

const envelope = {
  delivery: { severity: "CRITICAL", idempotency_key: "d1" },
  recipient: "+201000000000",
  payload: { alarmType: "HIGH_TEMPERATURE", triggerValue: 9.2, occurredAt: "2026-09-02T10:00:00Z" },
} as never;

describe("MetaWhatsappProvider", () => {
  it("sends an approved template and returns Meta's receipt", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 })
      );
    const provider = new MetaWhatsappProvider(
      "META",
      "https://graph.facebook.com/v23.0/1/messages",
      "secret",
      "bioems_alarm_alert",
      "en_US",
      request
    );
    await expect(provider.send(envelope, new AbortController().signal)).resolves.toEqual({
      messageId: "wamid.1",
    });
    const options = request.mock.calls[0]?.[1] as RequestInit;
    expect(options.headers).toMatchObject({ Authorization: "Bearer secret" });
    expect(JSON.parse(String(options.body))).toMatchObject({
      messaging_product: "whatsapp",
      to: "201000000000",
      type: "template",
      template: { name: "bioems_alarm_alert" },
    });
  });

  it("fails closed on rejection or a missing provider receipt", async () => {
    const rejected = new MetaWhatsappProvider(
      "META",
      "https://graph.test/messages",
      "secret",
      "template",
      "en_US",
      vi.fn().mockResolvedValue(new Response("{}", { status: 400 }))
    );
    await expect(rejected.send(envelope, new AbortController().signal)).rejects.toThrow("rejected");
    const malformed = new MetaWhatsappProvider(
      "META",
      "https://graph.test/messages",
      "secret",
      "template",
      "en_US",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    );
    await expect(malformed.send(envelope, new AbortController().signal)).rejects.toThrow(
      "invalid receipt"
    );
  });
});
