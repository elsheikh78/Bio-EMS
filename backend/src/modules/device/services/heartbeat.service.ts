import type { HeartbeatPayload } from "../dto/heartbeat.schema";
import { DeviceRepository } from "../../../repositories/device.repository";
import { SiteRepository } from "../../../repositories/site.repository";

export const HEARTBEAT_REJECTION_REASONS = {
  INVALID_TOPIC: "INVALID_TOPIC",
  UNKNOWN_DEVICE: "UNKNOWN_DEVICE",
  DEVICE_NOT_OPERATIONAL: "DEVICE_NOT_OPERATIONAL",
  SITE_NOT_FOUND: "SITE_NOT_FOUND",
  SITE_MISMATCH: "SITE_MISMATCH",
} as const;

type Reason = (typeof HEARTBEAT_REJECTION_REASONS)[keyof typeof HEARTBEAT_REJECTION_REASONS];
type Context = { deviceId?: string; siteCode?: string };
type Dependencies = {
  deviceRepository: Pick<DeviceRepository, "findByDeviceId" | "recordCommunication">;
  siteRepository: Pick<SiteRepository, "findById">;
  now: () => Date;
  logRejection: (reason: Reason, context: Context) => void;
};

const defaultDependencies: Dependencies = {
  deviceRepository: new DeviceRepository(),
  siteRepository: new SiteRepository(),
  now: () => new Date(),
  logRejection: (reason, context) => console.warn("Heartbeat rejected", { reason, ...context }),
};

export class HeartbeatService {
  constructor(private readonly dependencies: Dependencies = defaultDependencies) {}

  process(topic: string, _payload: HeartbeatPayload): boolean {
    const parts = topic.split("/");
    if (parts.length !== 4 || parts[0] !== "bioems" || !parts[1] || !parts[3]) {
      this.dependencies.logRejection(HEARTBEAT_REJECTION_REASONS.INVALID_TOPIC, {});
      return false;
    }

    const [, siteCode, messageType, deviceId] = parts;
    if (messageType !== "heartbeat") {
      this.dependencies.logRejection(HEARTBEAT_REJECTION_REASONS.INVALID_TOPIC, {});
      return false;
    }

    const device = this.dependencies.deviceRepository.findByDeviceId(deviceId);
    if (!device)
      return this.reject(HEARTBEAT_REJECTION_REASONS.UNKNOWN_DEVICE, { deviceId, siteCode });
    if (device.status !== "active" || device.activated !== 1) {
      return this.reject(HEARTBEAT_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL, {
        deviceId,
        siteCode,
      });
    }

    const site = this.dependencies.siteRepository.findById(device.site_id);
    if (!site)
      return this.reject(HEARTBEAT_REJECTION_REASONS.SITE_NOT_FOUND, { deviceId, siteCode });
    if (site.code !== siteCode) {
      return this.reject(HEARTBEAT_REJECTION_REASONS.SITE_MISMATCH, { deviceId, siteCode });
    }

    return this.dependencies.deviceRepository.recordCommunication(
      deviceId,
      this.dependencies.now().toISOString(),
      "heartbeat"
    );
  }

  private reject(reason: Reason, context: Context): false {
    this.dependencies.logRejection(reason, context);
    return false;
  }
}
