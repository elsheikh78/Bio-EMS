import { config } from "../../config/config";
import { HttpSmsProvider } from "./http-sms.provider";
import { MetaWhatsappProvider } from "./meta-whatsapp.provider";
import { SmtpEmailProvider } from "./smtp-email.provider";
import { TelegramProvider } from "./telegram.provider";
import { NotificationDeliveryRepository } from "./notification-delivery.repository";
import { NotificationDeliveryWorker, type DeliveryProvider } from "./notification-delivery.worker";
import { NotificationEscalationOrchestrator } from "./notification-escalation.orchestrator";
import { CommunicationChannelRepository } from "../communication-channels/communication-channel.repository";
import { RuntimeCommunicationProvider } from "../communication-channels/runtime-communication.provider";

export function startNotificationDeliveryRuntime(): (() => void) | undefined {
  const settings = config.notificationDelivery;
  if (!settings.enabled) return undefined;
  const providers: DeliveryProvider[] = [];
  if (config.communicationConfigEncryptionKey) {
    const repository = new CommunicationChannelRepository(config.communicationConfigEncryptionKey);
    providers.push(
      ...(["EMAIL", "TELEGRAM", "WHATSAPP", "SMS"] as const).map(
        (channel) => new RuntimeCommunicationProvider(channel, repository)
      )
    );
  } else if (settings.whatsapp)
    providers.push(
      new MetaWhatsappProvider(
        settings.whatsapp.providerName,
        settings.whatsapp.endpoint,
        settings.whatsapp.token,
        settings.whatsapp.templateName,
        settings.whatsapp.languageCode
      )
    );
  if (!config.communicationConfigEncryptionKey && settings.email)
    providers.push(
      new SmtpEmailProvider(settings.email.providerName, settings.email.from, settings.email)
    );
  if (!config.communicationConfigEncryptionKey && settings.telegram)
    providers.push(
      new TelegramProvider(settings.telegram.providerName, settings.telegram.endpoint)
    );
  if (!config.communicationConfigEncryptionKey && settings.sms)
    providers.push(
      new HttpSmsProvider(settings.sms.providerName, settings.sms.endpoint, settings.sms.token)
    );
  const worker = new NotificationDeliveryWorker(
    new NotificationDeliveryRepository(),
    providers,
    settings.timeoutMs
  );
  const orchestrator = new NotificationEscalationOrchestrator();
  const run = () => {
    orchestrator.tick();
    void worker.tick();
  };
  const timer = setInterval(run, settings.pollIntervalMs);
  timer.unref();
  run();
  return () => clearInterval(timer);
}
