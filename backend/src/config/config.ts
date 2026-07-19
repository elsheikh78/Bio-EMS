import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3001,

  apiPrefix: process.env.API_PREFIX || "/api/v1",

  mqtt: {
    host: process.env.MQTT_HOST || "localhost",
    port: Number(process.env.MQTT_PORT) || 1883,
  },

  influx: {
    url: process.env.INFLUX_URL || "",
    token: process.env.INFLUX_TOKEN || "",
    org: process.env.INFLUX_ORG || "",
    bucket: process.env.INFLUX_BUCKET || "",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "",
  },

  logLevel: process.env.LOG_LEVEL || "info",
};