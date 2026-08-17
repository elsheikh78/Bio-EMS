import mqtt, { MqttClient } from "mqtt";
import { MQTT } from "../constants/mqtt.constants";
import { routeMessage } from "./router";
import { MQTT_TOPICS } from "./topics";

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (client) {
    return client;
  }

  client = mqtt.connect(`mqtt://${MQTT.HOST}:${MQTT.PORT}`, {
    clientId: MQTT.CLIENT_ID,

    username: MQTT.USERNAME || undefined,
    password: MQTT.PASSWORD || undefined,

    keepalive: MQTT.KEEPALIVE,
    reconnectPeriod: MQTT.RECONNECT_PERIOD,
    connectTimeout: MQTT.CONNECT_TIMEOUT,

    clean: MQTT.CLEAN,
  });

  client.on("connect", () => {
    console.log("MQTT Connected Successfully");

    client?.subscribe([MQTT_TOPICS.TELEMETRY, MQTT_TOPICS.HEARTBEAT], (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Subscribed : ${MQTT_TOPICS.TELEMETRY}`);
      console.log(`Subscribed : ${MQTT_TOPICS.HEARTBEAT}`);
    });
  });

  client.on("message", async (topic, payload) => {
    try {
      await routeMessage(topic, payload);
    } catch (err) {
      console.error(err);
    }
  });
  client.on("reconnect", () => {
    console.log("MQTT Reconnecting...");
  });

  client.on("offline", () => {
    console.log("MQTT Offline");
  });

  client.on("close", () => {
    console.log("MQTT Connection Closed");
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err);
  });

  return client;
}
