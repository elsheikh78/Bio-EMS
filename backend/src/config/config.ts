import dotenv from "dotenv";
import { loadJwtConfig } from "./jwt.config";
import { loadPlatformJwtConfig } from "./platform-jwt.config";
import { loadCorsConfig } from "./cors.config";
import { loadMqttConfig } from "./mqtt.config";
import { loadNotificationDeliveryConfig } from "./notification-delivery.config";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3001,

  apiPrefix: process.env.API_PREFIX || "/api/v1",

  mqtt: loadMqttConfig(process.env),

  influx: {
    url: process.env.INFLUX_URL || "",
    token: process.env.INFLUX_TOKEN || "",
    org: process.env.INFLUX_ORG || "",
    bucket: process.env.INFLUX_BUCKET || "",
  },

  jwt: loadJwtConfig(process.env),

  platformJwt: loadPlatformJwtConfig(process.env),

  cors: loadCorsConfig(process.env),

  notificationDelivery: loadNotificationDeliveryConfig(process.env),

  logLevel: process.env.LOG_LEVEL || "info",
};
