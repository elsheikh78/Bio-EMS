export interface NotificationDeliveryConfig {
  enabled: boolean;
  pollIntervalMs: number;
  timeoutMs: number;
  sms?: { endpoint: string; token: string; providerName: string };
}

export function loadNotificationDeliveryConfig(env: NodeJS.ProcessEnv): NotificationDeliveryConfig {
  const enabled = env.BIOEMS_NOTIFICATION_DELIVERY_ENABLED === "true";
  const pollIntervalMs = integer(env.BIOEMS_NOTIFICATION_POLL_INTERVAL_MS, 2_000, 250, 60_000);
  const timeoutMs = integer(env.BIOEMS_NOTIFICATION_TIMEOUT_MS, 15_000, 1_000, 120_000);
  if (!enabled) return { enabled, pollIntervalMs, timeoutMs };
  const endpoint = env.BIOEMS_SMS_PROVIDER_URL;
  const token = env.BIOEMS_SMS_PROVIDER_TOKEN;
  if (!endpoint || !token || !isHttps(endpoint)) {
    throw new Error("Notification delivery requires an HTTPS SMS provider and token");
  }
  return {
    enabled,
    pollIntervalMs,
    timeoutMs,
    sms: { endpoint, token, providerName: env.BIOEMS_SMS_PROVIDER_NAME || "PILOT_SMS" },
  };
}

function integer(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error("Invalid notification delivery timing configuration");
  }
  return parsed;
}

function isHttps(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
