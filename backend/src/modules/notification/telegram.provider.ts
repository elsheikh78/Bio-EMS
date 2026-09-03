import type { DeliveryEnvelope } from "./notification-delivery.repository";
import type { DeliveryProvider } from "./notification-delivery.worker";

type Fetch = typeof fetch;

export class TelegramProvider implements DeliveryProvider {
  readonly channel = "TELEGRAM" as const;

  constructor(
    readonly name: string,
    private readonly endpoint: string,
    private readonly request: Fetch = fetch
  ) {}

  async send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }> {
    const response = await this.request(this.endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: envelope.recipient,
        text: formatMessage(envelope),
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) throw new Error("Telegram provider rejected delivery");
    const body = (await response.json()) as {
      ok?: unknown;
      result?: { message_id?: unknown };
    };
    const messageId = body.result?.message_id;
    if (body.ok !== true || (typeof messageId !== "number" && typeof messageId !== "string")) {
      throw new Error("Telegram provider returned an invalid receipt");
    }
    return { messageId: String(messageId) };
  }
}

function formatMessage(envelope: DeliveryEnvelope): string {
  const payload = envelope.payload;
  return [
    `BIO-EMS ${envelope.delivery.severity} alarm`,
    `Type: ${String(payload.alarmType ?? payload.eventType ?? "ALARM")}`,
    `Value: ${String(payload.triggerValue ?? "—")}`,
    `Time: ${String(payload.occurredAt ?? "—")}`,
  ].join("\n");
}
