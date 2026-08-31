import { config } from "../../config/config";
import { HttpSmsProvider } from "./http-sms.provider";
import { NotificationDeliveryRepository } from "./notification-delivery.repository";
import { NotificationDeliveryWorker } from "./notification-delivery.worker";
import { NotificationEscalationOrchestrator } from "./notification-escalation.orchestrator";

export function startNotificationDeliveryRuntime(): (() => void) | undefined {
  const settings = config.notificationDelivery;
  if (!settings.enabled || !settings.sms) return undefined;
  const worker = new NotificationDeliveryWorker(
    new NotificationDeliveryRepository(),
    [new HttpSmsProvider(settings.sms.providerName, settings.sms.endpoint, settings.sms.token)],
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
