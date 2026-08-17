import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../repositories/device.repository", () => ({
  DeviceRepository: vi.fn(() => ({
    findByDeviceId: vi.fn(),
    recordCommunication: vi.fn(),
  })),
}));
vi.mock("../../../repositories/site.repository", () => ({
  SiteRepository: vi.fn(() => ({ findById: vi.fn() })),
}));
vi.mock("../../../repositories/sensor.repository", () => ({
  SensorRepository: vi.fn(() => ({ findByDeviceAndChannel: vi.fn() })),
}));
vi.mock("../../../../database/influx/writer", () => ({ writeTelemetryPoint: vi.fn() }));
vi.mock("../../../services/alarm.evaluator", () => ({ evaluateAlarm: vi.fn() }));

import { TELEMETRY_REJECTION_REASONS, TelemetryService } from "./telemetry.service";

const payload = {
  protocolVersion: "1.0",
  timestamp: "2026-08-10T08:00:00.000Z",
  battery: 90,
  signal: -55,
  sensors: [{ channel: 1, value: 7.5 }],
};

const activeDevice = {
  id: 8,
  uuid: "49db1d2a-95cc-4ad9-bdcb-823d8a29890f",
  device_id: "ZC-FW-001",
  site_id: 3,
  device_type: "zone-controller-firmware",
  protocol: "mqtt",
  status: "active",
  activated: 1,
};

const enabledSensor = {
  id: 11,
  uuid: "bf2fd96e-fef9-4620-948d-b73ef1e3d894",
  room_id: 5,
  device_id: 8,
  channel: 1,
  code: "TEMP-01",
  name: "Temperature",
  sensor_type: "temperature",
  unit: "°C",
  enabled: 1,
};

describe("Telemetry trust-boundary policy", () => {
  const dependencies = {
    deviceRepository: { findByDeviceId: vi.fn(), recordCommunication: vi.fn() },
    siteRepository: { findById: vi.fn() },
    sensorRepository: { findByDeviceAndChannel: vi.fn() },
    evaluateAlarm: vi.fn(),
    writeTelemetryPoint: vi.fn(),
    logRejection: vi.fn(),
    now: () => new Date("2026-08-10T08:00:05.000Z"),
  };
  const service = new TelemetryService(dependencies);

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.deviceRepository.findByDeviceId.mockReturnValue(activeDevice);
    dependencies.deviceRepository.recordCommunication.mockReturnValue(true);
    dependencies.siteRepository.findById.mockReturnValue({
      id: 3,
      code: "CAIRO01",
      name: "Cairo",
    });
    dependencies.sensorRepository.findByDeviceAndChannel.mockReturnValue(enabledSensor);
    dependencies.writeTelemetryPoint.mockResolvedValue(undefined);
  });

  const expectNoSideEffects = (trustedCommunication = false) => {
    if (trustedCommunication) {
      expect(dependencies.deviceRepository.recordCommunication).toHaveBeenCalledOnce();
    } else {
      expect(dependencies.deviceRepository.recordCommunication).not.toHaveBeenCalled();
    }
    expect(dependencies.evaluateAlarm).not.toHaveBeenCalled();
    expect(dependencies.writeTelemetryPoint).not.toHaveBeenCalled();
  };

  it("accepts active/1 telemetry for an exact Site and enabled Sensor", async () => {
    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.deviceRepository.findByDeviceId).toHaveBeenCalledWith("ZC-FW-001");
    expect(dependencies.siteRepository.findById).toHaveBeenCalledWith(3);
    expect(dependencies.sensorRepository.findByDeviceAndChannel).toHaveBeenCalledWith(8, 1);
    expect(dependencies.deviceRepository.recordCommunication).toHaveBeenCalledWith(
      "ZC-FW-001",
      "2026-08-10T08:00:05.000Z",
      "telemetry"
    );
    expect(dependencies.evaluateAlarm).toHaveBeenCalledOnce();
    expect(dependencies.writeTelemetryPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        site: "CAIRO01",
        device: "ZC-FW-001",
        sensor: "TEMP-01",
        value: 7.5,
      })
    );
    expect(dependencies.logRejection).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid root", "other/CAIRO01/telemetry/ZC-FW-001"],
    ["missing Site segment", "bioems//telemetry/ZC-FW-001"],
    ["missing Device segment", "bioems/CAIRO01/telemetry/"],
    ["wrong part count", "bioems/CAIRO01/telemetry"],
  ])("rejects %s as INVALID_TOPIC", async (_case, topic) => {
    await service.process(topic, payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.INVALID_TOPIC,
      {}
    );
    expect(dependencies.deviceRepository.findByDeviceId).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("rejects a non-telemetry message type before Device lookup", async () => {
    await service.process("bioems/CAIRO01/status/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.INVALID_MESSAGE_TYPE,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01" }
    );
    expect(dependencies.deviceRepository.findByDeviceId).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("preserves unknown-Device rejection without downstream lookups", async () => {
    dependencies.deviceRepository.findByDeviceId.mockReturnValue(undefined);

    await service.process("bioems/CAIRO01/telemetry/UNKNOWN", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.UNKNOWN_DEVICE,
      { deviceId: "UNKNOWN", siteCode: "CAIRO01" }
    );
    expect(dependencies.siteRepository.findById).not.toHaveBeenCalled();
    expect(dependencies.sensorRepository.findByDeviceAndChannel).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it.each([
    ["pending", 0],
    ["disabled", 0],
    ["active", 0],
    ["pending", 1],
    ["disabled", 1],
    ["unexpected", 1],
  ])("rejects non-operational lifecycle %s/%i", async (status, activated) => {
    dependencies.deviceRepository.findByDeviceId.mockReturnValue({
      ...activeDevice,
      status,
      activated,
    });

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01" }
    );
    expect(dependencies.siteRepository.findById).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("rejects a missing configured Site", async () => {
    dependencies.siteRepository.findById.mockReturnValue(undefined);

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.SITE_NOT_FOUND,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01" }
    );
    expect(dependencies.sensorRepository.findByDeviceAndChannel).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("rejects a case-sensitive Site mismatch", async () => {
    dependencies.siteRepository.findById.mockReturnValue({
      id: 3,
      code: "CAIRO01",
      name: "Cairo",
    });

    await service.process("bioems/cairo01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.SITE_MISMATCH,
      { deviceId: "ZC-FW-001", siteCode: "cairo01" }
    );
    expect(dependencies.sensorRepository.findByDeviceAndChannel).not.toHaveBeenCalled();
    expectNoSideEffects();
  });

  it("stops when the health update loses a concurrent lifecycle race", async () => {
    dependencies.deviceRepository.recordCommunication.mockReturnValue(false);

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.DEVICE_NOT_OPERATIONAL,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01" }
    );
    expect(dependencies.sensorRepository.findByDeviceAndChannel).not.toHaveBeenCalled();
    expect(dependencies.evaluateAlarm).not.toHaveBeenCalled();
    expect(dependencies.writeTelemetryPoint).not.toHaveBeenCalled();
  });

  it.each([
    ["zero", 0],
    ["missing", undefined],
    ["unexpected", 2],
  ])("rejects a Sensor whose enabled value is %s", async (_case, enabled) => {
    dependencies.sensorRepository.findByDeviceAndChannel.mockReturnValue({
      ...enabledSensor,
      enabled,
    });

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.SENSOR_DISABLED,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01", channel: 1 }
    );
    expectNoSideEffects(true);
  });

  it("rejects an unknown channel without side effects", async () => {
    dependencies.sensorRepository.findByDeviceAndChannel.mockReturnValue(undefined);

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", payload);

    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.UNKNOWN_CHANNEL,
      { deviceId: "ZC-FW-001", siteCode: "CAIRO01", channel: 1 }
    );
    expectNoSideEffects(true);
  });

  it("processes only valid readings in a mixed-channel payload", async () => {
    dependencies.sensorRepository.findByDeviceAndChannel.mockImplementation(
      (_deviceId, channel) => {
        if (channel === 1) return enabledSensor;
        if (channel === 3) return { ...enabledSensor, id: 13, channel: 3, enabled: 0 };
        return undefined;
      }
    );

    await service.process("bioems/CAIRO01/telemetry/ZC-FW-001", {
      ...payload,
      sensors: [
        { channel: 1, value: 7.5 },
        { channel: 2, value: 8 },
        { channel: 3, value: 9 },
      ],
    });

    expect(dependencies.evaluateAlarm).toHaveBeenCalledOnce();
    expect(dependencies.writeTelemetryPoint).toHaveBeenCalledOnce();
    expect(dependencies.writeTelemetryPoint).toHaveBeenCalledWith(
      expect.objectContaining({ sensor: "TEMP-01", value: 7.5 })
    );
    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.UNKNOWN_CHANNEL,
      expect.objectContaining({ channel: 2 })
    );
    expect(dependencies.logRejection).toHaveBeenCalledWith(
      TELEMETRY_REJECTION_REASONS.SENSOR_DISABLED,
      expect.objectContaining({ channel: 3 })
    );
  });
});
