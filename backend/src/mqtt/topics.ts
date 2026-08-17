export const MQTT_TOPICS = {
  TELEMETRY: "bioems/+/telemetry/+",

  HEARTBEAT: "bioems/+/heartbeat/+",

  STATUS: "bioems/device/+/status",

  ALARM: "bioems/device/+/alarm",

  CONFIG: "bioems/device/+/config",

  COMMAND: "bioems/device/+/command",
} as const;
