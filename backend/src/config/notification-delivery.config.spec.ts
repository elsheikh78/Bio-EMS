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
  it("requires HTTPS provider configuration when enabled", () => {
    expect(() =>
      loadNotificationDeliveryConfig({
        BIOEMS_NOTIFICATION_DELIVERY_ENABLED: "true",
        BIOEMS_SMS_PROVIDER_URL: "http://sms.test",
        BIOEMS_SMS_PROVIDER_TOKEN: "secret",
      })
    ).toThrow();
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
