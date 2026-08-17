import { describe, expect, it } from "vitest";
import { loadMqttConfig, MqttConfigurationError } from "./mqtt.config";

describe("MQTT configuration", () => {
  it("preserves safe development defaults", () => {
    expect(loadMqttConfig({})).toMatchObject({
      protocol: "mqtt",
      host: "localhost",
      port: 1883,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
    });
  });

  it("supports a stable authenticated MQTT TLS deployment", () => {
    expect(
      loadMqttConfig({
        MQTT_PROTOCOL: "mqtts",
        MQTT_HOST: "broker.example.com",
        MQTT_PORT: "8883",
        MQTT_CLIENT_ID: "bio-ems-pilot",
        MQTT_USERNAME: "backend",
        MQTT_PASSWORD: "secret",
        MQTT_CLEAN: "false",
      })
    ).toMatchObject({
      protocol: "mqtts",
      host: "broker.example.com",
      port: 8883,
      clientId: "bio-ems-pilot",
      username: "backend",
      password: "secret",
      clean: false,
    });
  });

  it.each([
    { MQTT_PROTOCOL: "http" },
    { MQTT_PORT: "0" },
    { MQTT_PORT: "65536" },
    { MQTT_KEEPALIVE: "NaN" },
    { MQTT_RECONNECT_PERIOD: "-1" },
  ])("rejects invalid values without returning partial configuration", (environment) => {
    expect(() => loadMqttConfig(environment)).toThrowError(MqttConfigurationError);
  });
});
