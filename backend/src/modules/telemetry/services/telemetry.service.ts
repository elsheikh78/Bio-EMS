import { TelemetryPayload } from "../schemas/telemetry.schema";
import { DeviceRepository } from "../../../repositories/device.repository";
import { SensorRepository } from "../../../repositories/sensor.repository";
import { SiteRepository } from "../../../repositories/site.repository";
import { writeTelemetryPoint } from "../../../../database/influx/writer";
import { evaluateAlarm } from "../../../services/alarm.evaluator";

const deviceRepository = new DeviceRepository();

const sensorRepository = new SensorRepository();

const siteRepository = new SiteRepository();

export const TELEMETRY_REJECTION_REASONS = {
  INVALID_TOPIC: "INVALID_TOPIC",
  INVALID_MESSAGE_TYPE: "INVALID_MESSAGE_TYPE",
  UNKNOWN_DEVICE: "UNKNOWN_DEVICE",
  DEVICE_NOT_OPERATIONAL: "DEVICE_NOT_OPERATIONAL",
  SITE_NOT_FOUND: "SITE_NOT_FOUND",
  SITE_MISMATCH: "SITE_MISMATCH",
  UNKNOWN_CHANNEL: "UNKNOWN_CHANNEL",
  SENSOR_DISABLED: "SENSOR_DISABLED",
} as const;

export type TelemetryRejectionReason =
  (typeof TELEMETRY_REJECTION_REASONS)[keyof typeof TELEMETRY_REJECTION_REASONS];

type RejectionContext = {
  deviceId?: string;
  siteCode?: string;
  channel?: number;
};

type TelemetryDependencies = {
  deviceRepository: Pick<DeviceRepository, "findByDeviceId" | "recordCommunication">;
  siteRepository: Pick<SiteRepository, "findById">;
  sensorRepository: Pick<SensorRepository, "findByDeviceAndChannel">;
  evaluateAlarm: typeof evaluateAlarm;
  writeTelemetryPoint: typeof writeTelemetryPoint;
  logRejection: (reason: TelemetryRejectionReason, context: RejectionContext) => void;
  now: () => Date;
};

const defaultDependencies: TelemetryDependencies = {
  deviceRepository,
  siteRepository,
  sensorRepository,
  evaluateAlarm,
  writeTelemetryPoint,
  logRejection: (reason, context) => console.warn("Telemetry rejected", { reason, ...context }),
  now: () => new Date(),
};

export class TelemetryService {
  constructor(private readonly dependencies: TelemetryDependencies = defaultDependencies) {}

  async process(topic: string, payload: TelemetryPayload): Promise<void> {
    const parts = topic.split("/");

    if (parts.length !== 4 || parts[0] !== "bioems" || !parts[1] || !parts[3]) {
      this.reject(TELEMETRY_REJECTION_REASONS.INVALID_TOPIC, {});
      return;
    }

    const [, siteCode, messageType, deviceId] = parts;

    if (messageType !== "telemetry") {
      this.reject(TELEMETRY_REJECTION_REASONS.INVALID_MESSAGE_TYPE, {
        deviceId,
        siteCode,
      });
      return;
    }

    const device = this.dependencies.deviceRepository.findByDeviceId(deviceId);

    if (!device) {
      this.reject(TELEMETRY_REJECTION_REASONS.UNKNOWN_DEVICE, { deviceId, siteCode });

      return;
    }

    if (device.status !== "active" || device.activated !== 1) {
      this.reject(TELEMETRY_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL, {
        deviceId,
        siteCode,
      });

      return;
    }

    const site = this.dependencies.siteRepository.findById(device.site_id);

    if (!site) {
      this.reject(TELEMETRY_REJECTION_REASONS.SITE_NOT_FOUND, { deviceId, siteCode });

      return;
    }

    if (site.code !== siteCode) {
      this.reject(TELEMETRY_REJECTION_REASONS.SITE_MISMATCH, { deviceId, siteCode });

      return;
    }

    if (
      !this.dependencies.deviceRepository.recordCommunication(
        device.device_id,
        this.dependencies.now().toISOString(),
        "telemetry"
      )
    ) {
      this.reject(TELEMETRY_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL, {
        deviceId,
        siteCode,
      });
      return;
    }

    console.log("====================================");

    console.log("Telemetry Accepted");

    console.log("Site       :", siteCode);

    console.log("Message    :", messageType);

    console.log("Device     :", device.device_id);

    for (const sensorData of payload.sensors) {
      const sensor = this.dependencies.sensorRepository.findByDeviceAndChannel(
        device.id!,
        sensorData.channel
      );

      if (!sensor) {
        this.reject(TELEMETRY_REJECTION_REASONS.UNKNOWN_CHANNEL, {
          deviceId,
          siteCode,
          channel: sensorData.channel,
        });

        continue;
      }

      if (sensor.enabled !== 1) {
        this.reject(TELEMETRY_REJECTION_REASONS.SENSOR_DISABLED, {
          deviceId,
          siteCode,
          channel: sensorData.channel,
        });

        continue;
      }

      console.log("------------------------------------");

      console.log("Sensor Resolved");

      console.log("Name       :", sensor.name);

      console.log("Type       :", sensor.sensor_type);

      console.log("Channel    :", sensor.channel);

      console.log("Value      :", sensorData.value, sensor.unit);

      if (payload.mode !== "REPLAY") {
        this.dependencies.evaluateAlarm({
          sensorId: sensor.id!,

          sensorName: sensor.name,

          value: sensorData.value,

          sensorType: sensor.sensor_type,

          warningLow: sensor.warning_low,

          alarmLow: sensor.alarm_low,

          warningHigh: sensor.warning_high,

          alarmHigh: sensor.alarm_high,
        });
      }

      await this.dependencies.writeTelemetryPoint({
        site: site.code,

        device: device.device_id,

        sensor: sensor.code,

        sensorType: sensor.sensor_type,

        unit: sensor.unit,

        value: sensorData.value,

        battery: payload.battery,

        signal: payload.signal,

        timestamp: payload.timestamp,
      });
    }

    console.log("====================================");
  }

  private reject(reason: TelemetryRejectionReason, context: RejectionContext): void {
    this.dependencies.logRejection(reason, context);
  }
}
