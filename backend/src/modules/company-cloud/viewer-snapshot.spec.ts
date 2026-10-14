import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  rooms: vi.fn(),
  sensors: vi.fn(),
  readings: vi.fn(),
  alarms: vi.fn(),
}));
vi.mock("../installation/installation-context.service", () => ({
  installationContextService: { current: mocks.context },
}));
vi.mock("../../repositories/room.repository", () => ({
  RoomRepository: class {
    getAll = mocks.rooms;
  },
}));
vi.mock("../../repositories/sensor.repository", () => ({
  SensorRepository: class {
    getAll = mocks.sensors;
  },
}));
vi.mock("../../repositories/viewer-export.repository", () => ({
  ViewerExportRepository: class {
    recentAlarms = mocks.alarms;
  },
}));
vi.mock("../../../database/influx/queries/room-status.query", () => ({
  getLatestRoomTelemetry: mocks.readings,
}));
import { buildViewerSnapshot } from "./viewer-snapshot";
const time = "2026-10-14T12:00:00.000Z";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.context.mockReturnValue({
    site: { id: 1, code: "MANIAL" },
    installationId: "installation",
  });
  mocks.rooms.mockReturnValue([
    { id: 1, site_id: 1, code: "CR1", name: "Room" },
    { id: 2, site_id: 2, code: "OTHER", name: "Other customer" },
  ]);
  mocks.sensors.mockReturnValue([
    {
      id: 1,
      room_id: 1,
      name: "Temp",
      code: "T1",
      sensor_type: "temperature",
      unit: "C",
      enabled: 1,
    },
    { id: 2, room_id: 2, code: "OTHER", enabled: 1 },
  ]);
  mocks.readings.mockResolvedValue([
    { siteCode: "MANIAL", sensorCode: "T1", sensorType: "temperature", value: 4, time },
    { siteCode: "OTHER", sensorCode: "OTHER", value: 99, time },
  ]);
  mocks.alarms.mockReturnValue([
    {
      id: 1,
      sensor_id: 1,
      type: "CRITICAL_HIGH",
      severity: "CRITICAL",
      status: "ACKNOWLEDGED",
      trigger_value: 10,
      trigger_time: "2026-10-14 11:59:00",
    },
    { id: 2, sensor_id: 2, status: "TRIGGERED" },
  ]);
});
describe("installer-bound viewer export", () => {
  it("exports every enabled installed-site sensor and persisted lifecycle only, without other sites", async () => {
    const result = await buildViewerSnapshot(Date.parse(time));
    expect(result.rooms).toHaveLength(1);
    expect(result.sensors).toHaveLength(1);
    expect(result.sensors[0]).toMatchObject({ value: 4, recordedAt: time });
    expect(result.alarms).toHaveLength(1);
    expect(result.alarms[0]).toMatchObject({
      status: "ACKNOWLEDGED",
      triggeredAt: "2026-10-14T11:59:00.000Z",
    });
    expect(JSON.stringify(result)).not.toContain("Other customer");
  });
  it("reports unavailable telemetry as null and retains active lifecycle alarms", async () => {
    mocks.readings.mockRejectedValue(new Error("Influx offline"));
    const result = await buildViewerSnapshot();
    expect(result.telemetryAvailable).toBe(false);
    expect(result.sensors[0].value).toBeNull();
    expect(result.alarms).toHaveLength(1);
  });
  it("fails closed if installed customer/site identity cannot be verified", async () => {
    mocks.context.mockImplementation(() => {
      throw new Error("Receipt missing");
    });
    await expect(buildViewerSnapshot()).rejects.toThrow("Receipt missing");
    expect(mocks.readings).not.toHaveBeenCalled();
  });
  it("does not attach another site's reading with a matching sensor code", async () => {
    mocks.readings.mockResolvedValue([
      { siteCode: "OTHER", sensorCode: "T1", sensorType: "temperature", value: 99, time },
    ]);
    expect((await buildViewerSnapshot()).sensors[0].value).toBeNull();
  });
});
