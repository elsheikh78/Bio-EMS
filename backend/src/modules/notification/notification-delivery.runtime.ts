import { config } from "../../config/config";
import { HttpSmsProvider } from "./http-sms.provider";
import { NotificationDeliveryRepository } from "./notification-delivery.repository";
import { NotificationDeliveryWorker } from "./notification-delivery.worker";

export function startNotificationDeliveryRuntime(): (() => void) | undefined {
  const settings = config.notificationDelivery;
  if (!settings.enabled || !settings.sms) return undefined;
  const worker = new NotificationDeliveryWorker(
    new NotificationDeliveryRepository(),
    [new HttpSmsProvider(settings.sms.providerName, settings.sms.endpoint, settings.sms.token)],
    settings.timeoutMs
  );
  const timer = setInterval(() => void worker.tick(), settings.pollIntervalMs);
  timer.unref();
  void worker.tick();
  return () => clearInterval(timer);
}
