import { describe, expect, it, vi } from "vitest";
import { createMonitoredAreasApi } from "./api";

describe("monitored areas API", () => {
  it("requests and validates the Site collection", async () => {
    const payload = [
      {
        id: 1,
        code: "CAIRO",
        name: "Cairo Site",
        location: null,
        timezone: "Africa/Cairo",
        active: 1,
      },
    ];

    const protectedRequest = vi.fn().mockResolvedValue(payload);
    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getSites()).resolves.toEqual(payload);

    expect(protectedRequest).toHaveBeenCalledTimes(1);
    expect(protectedRequest).toHaveBeenCalledWith("/sites");
  });

  it("rejects a malformed Site success response", async () => {
    const protectedRequest = vi.fn().mockResolvedValue([
      {
        id: 1,
        code: "CAIRO",
        name: "Cairo Site",
        unexpected: true,
      },
    ]);

    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getSites()).rejects.toThrow();
  });

  it("requests and validates the Room collection", async () => {
    const payload = [
      {
        id: 10,
        uuid: "room-uuid-1",
        site_id: 1,
        code: "CR-01",
        name: "Cold Room 01",
        description: null,
        active: 1,
        created_at: "2026-08-13 08:00:00",
        updated_at: "2026-08-13 08:00:00",
      },
    ];

    const protectedRequest = vi.fn().mockResolvedValue(payload);
    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getRooms()).resolves.toEqual(payload);

    expect(protectedRequest).toHaveBeenCalledTimes(1);
    expect(protectedRequest).toHaveBeenCalledWith("/rooms");
  });

  it("rejects a malformed Room success response", async () => {
    const protectedRequest = vi.fn().mockResolvedValue([
      {
        id: 10,
        uuid: "room-uuid-1",
        site_id: "1",
        code: "CR-01",
        name: "Cold Room 01",
      },
    ]);

    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getRooms()).rejects.toThrow();
  });

  it("requests and validates the Sensor collection", async () => {
    const payload = [
      {
        id: 100,
        uuid: "sensor-uuid-1",
        room_id: 10,
        device_id: 20,
        channel: 0,
        code: "TEMP-01",
        name: "Temperature Sensor 01",
        sensor_type: "temperature",
        unit: "C",
        min_value: null,
        max_value: 50,
        warning_low: 2,
        alarm_low: 0,
        warning_high: 8,
        alarm_high: 10,
        enabled: 1,
        created_at: "2026-08-13 08:00:00",
        updated_at: "2026-08-13 08:00:00",
      },
    ];

    const protectedRequest = vi.fn().mockResolvedValue(payload);
    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getSensors()).resolves.toEqual(payload);

    expect(protectedRequest).toHaveBeenCalledTimes(1);
    expect(protectedRequest).toHaveBeenCalledWith("/sensors");
  });

  it("rejects a malformed Sensor success response", async () => {
    const protectedRequest = vi.fn().mockResolvedValue([
      {
        id: 100,
        uuid: "sensor-uuid-1",
        room_id: 10,
        device_id: 20,
        channel: 0,
        code: "TEMP-01",
        name: "Temperature Sensor 01",
        sensor_type: "temperature",
      },
    ]);

    const api = createMonitoredAreasApi(protectedRequest);

    await expect(api.getSensors()).rejects.toThrow();
  });

  it("does not supply request options or caller-provided Authorization headers", async () => {
    const protectedRequest = vi.fn().mockResolvedValue([]);
    const api = createMonitoredAreasApi(protectedRequest);

    await api.getSites();
    await api.getRooms();
    await api.getSensors();

    expect(protectedRequest).toHaveBeenNthCalledWith(1, "/sites");
    expect(protectedRequest).toHaveBeenNthCalledWith(2, "/rooms");
    expect(protectedRequest).toHaveBeenNthCalledWith(3, "/sensors");

    for (const call of protectedRequest.mock.calls) {
      expect(call).toHaveLength(1);
    }
  });
});
