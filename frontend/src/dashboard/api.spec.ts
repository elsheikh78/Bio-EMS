import { describe, expect, it, vi } from "vitest";
import { createDashboardApi } from "./api";

describe("dashboard API", () => {
  it("loads and validates the dashboard summary", async () => {
    const protectedRequest = vi.fn().mockResolvedValue({
      totalSites: 2,
      totalRooms: 6,
      totalDevices: 4,
      totalSensors: 18,
      activeAlarms: 3,
      onlineDevices: 1,
      staleDevices: 1,
      offlineDevices: 1,
      neverSeenDevices: 1,
      notOperationalDevices: 0,
    });

    const api = createDashboardApi(protectedRequest);

    await expect(api.getSummary()).resolves.toEqual({
      totalSites: 2,
      totalRooms: 6,
      totalDevices: 4,
      totalSensors: 18,
      activeAlarms: 3,
      onlineDevices: 1,
      staleDevices: 1,
      offlineDevices: 1,
      neverSeenDevices: 1,
      notOperationalDevices: 0,
    });

    expect(protectedRequest).toHaveBeenCalledWith("/dashboard/summary");
  });

  it("loads and validates latest telemetry", async () => {
    const telemetry = [
      {
        time: "2026-08-12T12:00:00.000Z",
        site: "main-site",
        device: "device-01",
        sensor: "sensor-01",
        sensorType: "temperature",
        unit: "C",
        value: 4.2,
      },
    ];

    const protectedRequest = vi.fn().mockResolvedValue(telemetry);
    const api = createDashboardApi(protectedRequest);

    await expect(api.getLatestTelemetry()).resolves.toEqual(telemetry);

    expect(protectedRequest).toHaveBeenCalledWith(
      "/dashboard/latest-telemetry",
    );
  });

  it("loads and validates room status", async () => {
    const rooms = [
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
    ];

    const protectedRequest = vi.fn().mockResolvedValue(rooms);
    const api = createDashboardApi(protectedRequest);

    await expect(api.getRoomStatuses()).resolves.toEqual(rooms);

    expect(protectedRequest).toHaveBeenCalledWith("/dashboard/rooms/status");
  });

  it("loads and validates alarm statistics", async () => {
    const statistics = {
      active: 3,
      acknowledged: 2,
      recovered: 8,
      critical: 1,
      warning: 4,
      info: 2,
    };

    const protectedRequest = vi.fn().mockResolvedValue(statistics);
    const api = createDashboardApi(protectedRequest);

    await expect(api.getAlarmStatistics()).resolves.toEqual(statistics);

    expect(protectedRequest).toHaveBeenCalledWith(
      "/dashboard/alarm-statistics",
    );
  });

  it("rejects malformed backend data", async () => {
    const protectedRequest = vi.fn().mockResolvedValue({
      totalSites: "2",
      totalRooms: 6,
      totalDevices: 4,
      totalSensors: 18,
      activeAlarms: 3,
      onlineDevices: 1,
      staleDevices: 1,
      offlineDevices: 1,
      neverSeenDevices: 1,
      notOperationalDevices: 0,
    });

    const api = createDashboardApi(protectedRequest);

    await expect(api.getSummary()).rejects.toThrow();
  });
});
