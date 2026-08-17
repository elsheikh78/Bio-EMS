export type MqttProtocol = "mqtt" | "mqtts";

export interface MqttConfig {
  protocol: MqttProtocol;
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  keepalive: number;
  reconnectPeriod: number;
  connectTimeout: number;
  clean: boolean;
}

export class MqttConfigurationError extends Error {
  constructor() {
    super("Invalid MQTT configuration");
    this.name = "MqttConfigurationError";
  }
}

export function loadMqttConfig(environment: NodeJS.ProcessEnv): MqttConfig {
  const protocol = environment.MQTT_PROTOCOL ?? "mqtt";
  if (protocol !== "mqtt" && protocol !== "mqtts") {
    throw new MqttConfigurationError();
  }

  const host = environment.MQTT_HOST?.trim() || "localhost";
  const port = parsePositiveInteger(
    environment.MQTT_PORT,
    protocol === "mqtts" ? 8883 : 1883,
    65_535
  );
  const keepalive = parsePositiveInteger(environment.MQTT_KEEPALIVE, 60);
  const reconnectPeriod = parsePositiveInteger(environment.MQTT_RECONNECT_PERIOD, 5_000);
  const connectTimeout = parsePositiveInteger(environment.MQTT_CONNECT_TIMEOUT, 10_000);
  const clientId =
    environment.MQTT_CLIENT_ID?.trim() ||
    `bio-ems-backend-${Math.random().toString(16).substring(2, 8)}`;

  return {
    protocol,
    host,
    port,
    clientId,
    username: environment.MQTT_USERNAME || undefined,
    password: environment.MQTT_PASSWORD || undefined,
    keepalive,
    reconnectPeriod,
    connectTimeout,
    clean: environment.MQTT_CLEAN !== "false",
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  maximum?: number
): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) throw new MqttConfigurationError();

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || (maximum !== undefined && parsed > maximum)) {
    throw new MqttConfigurationError();
  }
  return parsed;
}
