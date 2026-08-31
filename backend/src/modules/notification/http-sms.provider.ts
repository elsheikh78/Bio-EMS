import type { DeliveryEnvelope } from "./notification-delivery.repository";
import type { DeliveryProvider } from "./notification-delivery.worker";

type Fetch = typeof fetch;
export class HttpSmsProvider implements DeliveryProvider {
  readonly channel = "SMS" as const;
  constructor(
    readonly name: string,
    private readonly endpoint: string,
    private readonly token: string,
    private readonly request: Fetch = fetch
  ) {}

  async send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }> {
    const response = await this.request(this.endpoint, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({
        to: envelope.recipient,
        idempotencyKey: envelope.delivery.idempotency_key,
        event: envelope.payload,
      }),
    });
    if (!response.ok) throw new Error("SMS provider rejected delivery");
    const body = (await response.json()) as { messageId?: unknown };
    if (typeof body.messageId !== "string" || body.messageId.length === 0) {
      throw new Error("SMS provider returned an invalid receipt");
    }
    return { messageId: body.messageId };
  }
}
