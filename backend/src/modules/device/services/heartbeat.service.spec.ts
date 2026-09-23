import { beforeEach, describe, expect, it, vi } from "vitest";
import { HEARTBEAT_REJECTION_REASONS, HeartbeatService } from "./heartbeat.service";

const device = {
  id: 8,
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 3,
  device_type: "zone-controller",
  protocol: "mqtt",
  status: "active",
  activated: 1,
};
const payload = { sent_at: "2026-08-17T09:00:00Z", uptime_seconds: 600 };

describe("Heartbeat trust boundary", () => {
  const dependencies = {
    deviceRepository: { findByDeviceId: vi.fn(), recordCommunication: vi.fn() },
    siteRepository: { findById: vi.fn() },
    bindingRepository: { findActiveByDeviceIdentity: vi.fn() },
    now: () => new Date("2026-08-17T09:00:05.000Z"),
    logRejection: vi.fn(),
  };
  const service = new HeartbeatService(dependencies);

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.deviceRepository.findByDeviceId.mockReturnValue(device);
    dependencies.deviceRepository.recordCommunication.mockReturnValue(true);
    dependencies.siteRepository.findById.mockReturnValue({ id: 3, code: "CAIRO01" });
    dependencies.bindingRepository.findActiveByDeviceIdentity.mockReturnValue(undefined);
  });

  it("records server receipt time for a trusted heartbeat", () => {
    expect(service.process("bioems/CAIRO01/heartbeat/ZC-FW-001", payload)).toBe(true);
    expect(dependencies.deviceRepository.recordCommunication).toHaveBeenCalledWith(
      "ZC-FW-001",
      "2026-08-17T09:00:05.000Z",
      "heartbeat"
    );
    expect(dependencies.logRejection).not.toHaveBeenCalled();
  });

  it("requires matching binding evidence for a paired heartbeat", () => {
    dependencies.bindingRepository.findActiveByDeviceIdentity.mockReturnValue({
      platform_binding_id: "11111111-1111-4111-8111-111111111111",
      device_identity: "ZC-FW-001",
      hardware_uid: "AABBCCDDEEFF",
      site_code: "CAIRO01",
      firmware_version: "0.1.0-pilot.1",
      protocol_version: "1.3",
    });

    expect(
      service.process("bioems/CAIRO01/heartbeat/ZC-FW-001", {
        ...payload,
        platform_binding_id: "11111111-1111-4111-8111-111111111111",
        hardware_uid: "AABBCCDDEEFF",
        firmware_version: "0.1.0-pilot.1",
        protocol_version: "1.3",
      })
    ).toBe(true);
  });

  it("rejects a paired heartbeat without matching binding evidence", () => {
    dependencies.bindingRepository.findActiveByDeviceIdentity.mockReturnValue({
      platform_binding_id: "11111111-1111-4111-8111-111111111111",
      device_identity: "ZC-FW-001",
      hardware_uid: "AABBCCDDEEFF",
      site_code: "CAIRO01",
      firmware_version: "0.1.0-pilot.1",
      protocol_version: "1.3",
    });

    expect(service.process("bioems/CAIRO01/heartbeat/ZC-FW-001", payload)).toBe(false);
    expect(dependencies.logRejection).toHaveBeenCalledWith(
      HEARTBEAT_REJECTION_REASONS.DEVICE_BINDING_MISMATCH,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01" }
    );
    expect(dependencies.deviceRepository.recordCommunication).not.toHaveBeenCalled();
  });

  it.each([
    [
      "unknown Device",
      undefined,
      { id: 3, code: "CAIRO01" },
      HEARTBEAT_REJECTION_REASONS.UNKNOWN_DEVICE,
    ],
    [
      "non-operational Device",
      { ...device, status: "disabled", activated: 0 },
      { id: 3, code: "CAIRO01" },
      HEARTBEAT_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL,
    ],
    ["missing Site", device, undefined, HEARTBEAT_REJECTION_REASONS.SITE_NOT_FOUND],
    ["Site mismatch", device, { id: 3, code: "OTHER" }, HEARTBEAT_REJECTION_REASONS.SITE_MISMATCH],
  ])("rejects %s without marking health", (_case, resolvedDevice, site, reason) => {
    dependencies.deviceRepository.findByDeviceId.mockReturnValue(resolvedDevice);
    dependencies.siteRepository.findById.mockReturnValue(site);

    expect(service.process("bioems/CAIRO01/heartbeat/ZC-FW-001", payload)).toBe(false);
    expect(dependencies.logRejection).toHaveBeenCalledWith(reason, {
      deviceId: "ZC-FW-001",
      siteCode: "CAIRO01",
    });
    expect(dependencies.deviceRepository.recordCommunication).not.toHaveBeenCalled();
  });
});
