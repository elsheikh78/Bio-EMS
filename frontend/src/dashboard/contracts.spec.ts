import { describe, expect, it } from "vitest";
import {
  dashboardAlarmStatisticsSchema,
  dashboardRoomStatusesSchema,
  dashboardSummarySchema,
  latestTelemetrySchema,
} from "./contracts";

describe("dashboard contracts", () => {
  it("accepts the current summary contract", () => {
    expect(
      dashboardSummarySchema.parse({
        totalSites: 2,
        totalRooms: 6,
        totalDevices: 4,
        totalSensors: 18,
        activeAlarms: 3,
        offlineDevices: 1,
      }),
    ).toEqual({
      totalSites: 2,
      totalRooms: 6,
      totalDevices: 4,
      totalSensors: 18,
      activeAlarms: 3,
      offlineDevices: 1,
    });
  });

  it("rejects unknown summary fields", () => {
    expect(() =>
      dashboardSummarySchema.parse({
        totalSites: 2,
        totalRooms: 6,
        totalDevices: 4,
        totalSensors: 18,
        activeAlarms: 3,
        offlineDevices: 1,
        unexpected: true,
      }),
    ).toThrow();
  });

  it("accepts the current room-status contract", () => {
    expect(
      dashboardRoomStatusesSchema.parse([
        {
          roomId: 1,
          roomName: "Cold Room 1",
          siteId: 1,
          siteName: "Main Site",
          temperature: 4.2,
          humidity: 56,
          temperatureStatus: "NORMAL",
          humidityStatus: "WARNING",
          activeAlarms: 1,
          online: true,
          lastUpdate: "2026-08-12T12:00:00.000Z",
        },
      ]),
    ).toHaveLength(1);
  });

  it("accepts the current alarm-statistics contract", () => {
    expect(
      dashboardAlarmStatisticsSchema.parse({
        active: 3,
        acknowledged: 2,
        recovered: 8,
        critical: 1,
        warning: 4,
        info: 2,
      }),
    ).toEqual({
      active: 3,
      acknowledged: 2,
      recovered: 8,
      critical: 1,
      warning: 4,
      info: 2,
    });
  });

  it("accepts the current latest-telemetry contract", () => {
    expect(
      latestTelemetrySchema.parse([
        {
          time: "2026-08-12T12:00:00.000Z",
          site: "main-site",
          device: "device-01",
          sensor: "sensor-01",
          sensorType: "temperature",
          unit: "C",
          value: 4.2,
        },
      ]),
    ).toHaveLength(1);
  });

  it("rejects malformed operational values", () => {
    expect(() =>
      latestTelemetrySchema.parse([
        {
          time: "2026-08-12T12:00:00.000Z",
          site: "main-site",
          device: "device-01",
          sensor: "sensor-01",
          sensorType: "temperature",
          unit: "C",
          value: "4.2",
        },
      ]),
    ).toThrow();
  });
});
