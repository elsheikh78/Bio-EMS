import "dotenv/config";
import { randomUUID } from "node:crypto";
import { loadNotificationDeliveryConfig } from "../config/notification-delivery.config";
import type { DeliveryEnvelope } from "../modules/notification/notification-delivery.repository";
import { TelegramProvider } from "../modules/notification/telegram.provider";

async function run(): Promise<void> {
  const recipient = process.env.BIOEMS_TELEGRAM_TEST_CHAT_ID?.trim();
  if (!recipient || !/^-?\d{1,20}$/.test(recipient)) {
    throw new Error("BIOEMS_TELEGRAM_TEST_CHAT_ID must be a numeric Telegram Chat ID");
  }
  const config = loadNotificationDeliveryConfig({
    ...process.env,
    BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
  });
  if (!config.telegram) throw new Error("A complete Telegram configuration is required");

  const now = new Date().toISOString();
  const envelope: DeliveryEnvelope = {
    recipient,
    payload: {
      eventType: "TELEGRAM_CONFIGURATION_TEST",
      message: "BIO-EMS Telegram delivery is configured correctly.",
      occurredAt: now,
    },
    delivery: {
      id: 0,
      uuid: randomUUID(),
      notification_event_id: 0,
      site_id: 0,
      recipient_id: 0,
      channel: "TELEGRAM",
      severity: "WARNING",
      status: "PROCESSING",
      idempotency_key: `telegram-test:${randomUUID()}`,
      attempt_count: 0,
      max_attempts: 1,
      next_attempt_at: now,
      claimed_at: now,
      claim_token: randomUUID(),
      provider_message_id: null,
      sent_at: null,
      delivered_at: null,
      failed_at: null,
      last_error_code: null,
      created_at: now,
      updated_at: null,
    },
  };

  const provider = new TelegramProvider(config.telegram.providerName, config.telegram.endpoint);
  await provider.send(envelope, new AbortController().signal);
  console.log("BIO-EMS Telegram delivery test: SENT");
}

run().catch((error: unknown) => {
  console.error("BIO-EMS Telegram delivery test: FAILED");
  console.error(error instanceof Error ? error.message : "Unknown Telegram delivery error");
  process.exitCode = 1;
});
