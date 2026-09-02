export interface NotificationDeliveryConfig {
  enabled: boolean;
  pollIntervalMs: number;
  timeoutMs: number;
  sms?: { endpoint: string; token: string; providerName: string };
  whatsapp?: {
    endpoint: string;
    token: string;
    providerName: string;
    templateName: string;
    languageCode: string;
  };
  email?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    from: string;
    providerName: string;
  };
}

export function loadNotificationDeliveryConfig(env: NodeJS.ProcessEnv): NotificationDeliveryConfig {
  const enabled = env.BIOEMS_NOTIFICATION_DELIVERY_ENABLED === "true";
  const pollIntervalMs = integer(env.BIOEMS_NOTIFICATION_POLL_INTERVAL_MS, 2_000, 250, 60_000);
  const timeoutMs = integer(env.BIOEMS_NOTIFICATION_TIMEOUT_MS, 15_000, 1_000, 120_000);
  if (!enabled) return { enabled, pollIntervalMs, timeoutMs };
  const sms = optionalSms(env);
  const whatsapp = optionalWhatsapp(env);
  const email = optionalEmail(env);
  if (!sms && !whatsapp && !email) {
    throw new Error("Notification delivery requires at least one complete provider configuration");
  }
  return {
    enabled,
    pollIntervalMs,
    timeoutMs,
    ...(sms ? { sms } : {}),
    ...(whatsapp ? { whatsapp } : {}),
    ...(email ? { email } : {}),
  };
}

function optionalSms(env: NodeJS.ProcessEnv): NotificationDeliveryConfig["sms"] {
  const endpoint = env.BIOEMS_SMS_PROVIDER_URL;
  const token = env.BIOEMS_SMS_PROVIDER_TOKEN;
  if (!endpoint && !token) return undefined;
  if (!endpoint || !token || !isHttps(endpoint))
    throw new Error("Invalid SMS provider configuration");
  return { endpoint, token, providerName: env.BIOEMS_SMS_PROVIDER_NAME || "PILOT_SMS" };
}

function optionalWhatsapp(env: NodeJS.ProcessEnv): NotificationDeliveryConfig["whatsapp"] {
  const phoneNumberId = env.BIOEMS_WHATSAPP_PHONE_NUMBER_ID;
  const token = env.BIOEMS_WHATSAPP_ACCESS_TOKEN;
  const templateName = env.BIOEMS_WHATSAPP_TEMPLATE_NAME;
  if (!phoneNumberId && !token && !templateName) return undefined;
  if (!phoneNumberId || !token || !templateName || !/^\d+$/.test(phoneNumberId)) {
    throw new Error("Invalid WhatsApp provider configuration");
  }
  const graphVersion = env.BIOEMS_WHATSAPP_GRAPH_VERSION || "v23.0";
  return {
    endpoint: `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    token,
    templateName,
    languageCode: env.BIOEMS_WHATSAPP_TEMPLATE_LANGUAGE || "en_US",
    providerName: "META_WHATSAPP_CLOUD",
  };
}

function optionalEmail(env: NodeJS.ProcessEnv): NotificationDeliveryConfig["email"] {
  const host = env.BIOEMS_EMAIL_SMTP_HOST;
  const username = env.BIOEMS_EMAIL_SMTP_USERNAME;
  const password = env.BIOEMS_EMAIL_SMTP_PASSWORD;
  const from = env.BIOEMS_EMAIL_FROM;
  if (!host && !username && !password && !from) return undefined;
  if (!host || !username || !password || !from)
    throw new Error("Invalid Email provider configuration");
  const port = integer(env.BIOEMS_EMAIL_SMTP_PORT, 465, 1, 65535);
  return {
    host,
    port,
    secure: env.BIOEMS_EMAIL_SMTP_SECURE !== "false",
    username,
    password,
    from,
    providerName: "SMTP_EMAIL",
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
