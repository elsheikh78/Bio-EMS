import { describe, expect, it } from "vitest";
import { loadNotificationDeliveryConfig } from "./notification-delivery.config";

describe("notification delivery configuration", () => {
  it("is safely disabled by default", () => {
    expect(loadNotificationDeliveryConfig({})).toEqual({
      enabled: false,
      pollIntervalMs: 2000,
      timeoutMs: 15000,
    });
  });
  it("rejects incomplete provider configuration when enabled", () => {
    expect(() =>
      loadNotificationDeliveryConfig({
        BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
        BIOEMS_SMS_PROVIDER_URL: "http://sms.test",
        BIOEMS_SMS_PROVIDER_TOKEN: "secret",
      })
    ).toThrow();
  });
  it("loads WhatsApp and Email as primary providers without exposing credentials", () => {
    const value = loadNotificationDeliveryConfig({
      BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
      BIOEMS_WHATSAPP_PHONE_NUMBER_ID: "123456",
      BIOEMS_WHATSAPP_ACCESS_TOKEN: "wa-secret",
      BIOEMS_WHATSAPP_TEMPLATE_NAME: "bioems_alarm_alert",
      BIOEMS_EMAIL_SMTP_HOST: "smtp.example.com",
      BIOEMS_EMAIL_SMTP_USERNAME: "alerts",
      BIOEMS_EMAIL_SMTP_PASSWORD: "mail-secret",
      BIOEMS_EMAIL_FROM: "BIO-EMS <alerts@example.com>",
    });
    expect(value.whatsapp).toMatchObject({
      providerName: "META_WHATSAPP_CLOUD",
      templateName: "bioems_alarm_alert",
    });
    expect(value.email).toMatchObject({ providerName: "SMTP_EMAIL", port: 465, secure: true });
  });
  it("loads an enabled provider without exposing its token in errors", () => {
    const value = loadNotificationDeliveryConfig({
      BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
      BIOEMS_SMS_PROVIDER_URL: "https://sms.test/send",
      BIOEMS_SMS_PROVIDER_TOKEN: "secret",
      BIOEMS_SMS_PROVIDER_NAME: "pilot",
    });
    expect(value.sms?.providerName).toBe("pilot");
  });
});
