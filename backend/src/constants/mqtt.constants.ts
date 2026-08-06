export const MQTT = {
  HOST: process.env.MQTT_HOST || "localhost",
  PORT: Number(process.env.MQTT_PORT || 1883),

  CLIENT_ID:
    process.env.MQTT_CLIENT_ID || `bio-ems-backend-${Math.random().toString(16).substring(2, 8)}`,

  USERNAME: process.env.MQTT_USERNAME || "",

  PASSWORD: process.env.MQTT_PASSWORD || "",

  KEEPALIVE: Number(process.env.MQTT_KEEPALIVE || 60),

  RECONNECT_PERIOD: Number(process.env.MQTT_RECONNECT_PERIOD || 5000),

  CONNECT_TIMEOUT: Number(process.env.MQTT_CONNECT_TIMEOUT || 10000),

  CLEAN: process.env.MQTT_CLEAN !== "false",
};
