import type { CommunicationChannelRepository } from "./communication-channel.repository";
import type { DeliveryEnvelope } from "../notification/notification-delivery.repository";
import type { DeliveryProvider } from "../notification/notification-delivery.worker";
import { HttpSmsProvider } from "../notification/http-sms.provider";
import { MetaWhatsappProvider } from "../notification/meta-whatsapp.provider";
import { SmtpEmailProvider } from "../notification/smtp-email.provider";
import { TelegramProvider } from "../notification/telegram.provider";
import type { CommunicationChannel } from "./communication-channel.schema";
import { LocalModemSmsProvider } from "./local-modem-sms.provider";

export class RuntimeCommunicationProvider implements DeliveryProvider {
  readonly name: string;

  constructor(
    readonly channel: CommunicationChannel,
    private readonly configurations: CommunicationChannelRepository
  ) {
    this.name = `DYNAMIC_${channel}`;
  }

  async send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }> {
    const resolved = this.configurations.resolveRuntimeForSite(
      envelope.delivery.site_id,
      this.channel
    );
    if (!resolved) throw new Error("Enabled communication channel configuration unavailable");
    const { config, secrets } = resolved;
    switch (config.channel) {
      case "EMAIL":
        return new SmtpEmailProvider(
          "CONFIGURED_SMTP_EMAIL",
          `${config.senderName} <${config.senderAddress}>`,
          {
            host: config.host,
            port: config.port,
            secure: config.security === "TLS",
            username: config.username,
            password: required(secrets.password),
          }
        ).send(envelope, signal);
      case "TELEGRAM":
        return new TelegramProvider(
          "CONFIGURED_TELEGRAM_BOT",
          `https://api.telegram.org/bot${required(secrets.botToken)}/sendMessage`
        ).send(envelope, signal);
      case "WHATSAPP":
        return new MetaWhatsappProvider(
          "CONFIGURED_META_WHATSAPP",
          `https://graph.facebook.com/v23.0/${config.phoneNumberId}/messages`,
          required(secrets.accessToken),
          config.templateName,
          config.languageCode
        ).send(envelope, signal);
      case "SMS":
        if (config.transport === "LOCAL_MODEM")
          return new LocalModemSmsProvider(config.comPort).send(envelope, signal);
        return new HttpSmsProvider(
          "CONFIGURED_HTTP_SMS",
          config.providerUrl,
          required(secrets.providerToken)
        ).send(envelope, signal);
    }
  }
}

function required(value: string | undefined): string {
  if (!value) throw new Error("Required communication provider secret is unavailable");
  return value;
}
