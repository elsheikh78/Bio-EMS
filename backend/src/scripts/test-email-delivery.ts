import "dotenv/config";
import { randomUUID } from "node:crypto";
import { loadNotificationDeliveryConfig } from "../config/notification-delivery.config";
import type { DeliveryEnvelope } from "../modules/notification/notification-delivery.repository";
import { SmtpEmailProvider } from "../modules/notification/smtp-email.provider";

async function run(): Promise<void> {
  const recipient = process.env.BIOEMS_EMAIL_TEST_RECIPIENT?.trim();
  if (!recipient) throw new Error("BIOEMS_EMAIL_TEST_RECIPIENT is required");

  const config = loadNotificationDeliveryConfig({
    ...process.env,
    BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
  });
  if (!config.email) throw new Error("A complete SMTP email configuration is required");

  const provider = new SmtpEmailProvider(
    config.email.providerName,
    config.email.from,
    config.email
  );
  const now = new Date().toISOString();
  const envelope: DeliveryEnvelope = {
    recipient,
    payload: {
      eventType: "SMTP_CONFIGURATION_TEST",
      message: "BIO-EMS email delivery is configured correctly.",
      occurredAt: now,
    },
    delivery: {
      id: 0,
      uuid: randomUUID(),
      notification_event_id: 0,
      site_id: 0,
      recipient_id: 0,
      channel: "EMAIL",
      severity: "WARNING",
      status: "PROCESSING",
      idempotency_key: `email-test:${randomUUID()}`,
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

  await provider.send(envelope, new AbortController().signal);
  console.log("BIO-EMS email delivery test: SENT");
}

run().catch((error: unknown) => {
  console.error("BIO-EMS email delivery test: FAILED");
  console.error(error instanceof Error ? error.message : "Unknown email delivery error");
  process.exitCode = 1;
});
