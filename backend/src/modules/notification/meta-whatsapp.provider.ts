import type { DeliveryEnvelope } from "./notification-delivery.repository";
import type { DeliveryProvider } from "./notification-delivery.worker";

type Fetch = typeof fetch;

export class MetaWhatsappProvider implements DeliveryProvider {
  readonly channel = "WHATSAPP" as const;
  constructor(
    readonly name: string,
    private readonly endpoint: string,
    private readonly token: string,
    private readonly templateName: string,
    private readonly languageCode: string,
    private readonly request: Fetch = fetch
  ) {}

  async send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }> {
    const response = await this.request(this.endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: envelope.recipient.replace(/^\+/, ""),
        type: "template",
        template: {
          name: this.templateName,
          language: { code: this.languageCode },
          components: [{ type: "body", parameters: templateParameters(envelope) }],
        },
      }),
    });
    if (!response.ok) throw new Error("WhatsApp provider rejected delivery");
    const body = (await response.json()) as { messages?: Array<{ id?: unknown }> };
    const messageId = body.messages?.[0]?.id;
    if (typeof messageId !== "string" || !messageId)
      throw new Error("WhatsApp provider returned an invalid receipt");
    return { messageId };
  }
}

function templateParameters(envelope: DeliveryEnvelope) {
  const payload = envelope.payload;
  return [
    envelope.delivery.severity,
    String(payload.alarmType ?? payload.eventType ?? "ALARM"),
    String(payload.triggerValue ?? "—"),
    String(payload.occurredAt ?? "—"),
  ].map((text) => ({ type: "text", text }));
}
