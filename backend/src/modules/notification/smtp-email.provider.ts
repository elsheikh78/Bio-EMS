import nodemailer, { type Transporter } from "nodemailer";
import type { DeliveryEnvelope } from "./notification-delivery.repository";
import type { DeliveryProvider } from "./notification-delivery.worker";

export class SmtpEmailProvider implements DeliveryProvider {
  readonly channel = "EMAIL" as const;
  private readonly transport: Pick<Transporter, "sendMail">;
  constructor(
    readonly name: string,
    private readonly from: string,
    settings: { host: string; port: number; secure: boolean; username: string; password: string },
    transport?: Pick<Transporter, "sendMail">
  ) {
    this.transport =
      transport ??
      nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: { user: settings.username, pass: settings.password },
      });
  }

  async send(envelope: DeliveryEnvelope, _signal: AbortSignal): Promise<{ messageId: string }> {
    const subject = `[BIO-EMS ${envelope.delivery.severity}] Environmental alarm`;
    const info = await this.transport.sendMail({
      from: this.from,
      to: envelope.recipient,
      subject,
      text: `${subject}\n\n${formatPayload(envelope.payload)}`,
    });
    if (typeof info.messageId !== "string" || !info.messageId)
      throw new Error("Email provider returned an invalid receipt");
    return { messageId: info.messageId };
  }
}

function formatPayload(payload: Readonly<Record<string, unknown>>): string {
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}
