import mqtt, { MqttClient } from "mqtt";
import { config } from "../config/config";
import { routeMessage } from "./router";
import { MQTT_TOPICS } from "./topics";

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient {
  if (client) {
    return client;
  }

  client = mqtt.connect(`${config.mqtt.protocol}://${config.mqtt.host}:${config.mqtt.port}`, {
    clientId: config.mqtt.clientId,

    username: config.mqtt.username,
    password: config.mqtt.password,

    keepalive: config.mqtt.keepalive,
    reconnectPeriod: config.mqtt.reconnectPeriod,
    connectTimeout: config.mqtt.connectTimeout,

    clean: config.mqtt.clean,
  });

  client.on("connect", () => {
    console.log("MQTT Connected Successfully");

    client?.subscribe([MQTT_TOPICS.TELEMETRY, MQTT_TOPICS.HEARTBEAT], { qos: 1 }, (err) => {
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
