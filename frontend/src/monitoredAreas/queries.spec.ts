import { describe, expect, it, vi } from "vitest";
import type { MonitoredAreasApi } from "./api";
import {
  monitoredAreasQueryKeys,
  roomsQueryOptions,
  sensorsQueryOptions,
  sitesQueryOptions,
} from "./queries";

function createApiMock(): MonitoredAreasApi {
  return {
    getSites: vi.fn().mockResolvedValue([]),
    getRooms: vi.fn().mockResolvedValue([]),
    getSensors: vi.fn().mockResolvedValue([]),
  };
}

describe("monitored areas queries", () => {
  it("defines stable hierarchical query keys", () => {
    expect(monitoredAreasQueryKeys.all).toEqual(["monitoredAreas"]);

    expect(monitoredAreasQueryKeys.sites()).toEqual([
      "monitoredAreas",
      "sites",
    ]);

    expect(monitoredAreasQueryKeys.rooms()).toEqual([
      "monitoredAreas",
      "rooms",
    ]);

    expect(monitoredAreasQueryKeys.sensors()).toEqual([
      "monitoredAreas",
      "sensors",
    ]);
  });

  it("defines the Sites query through the monitored areas API", async () => {
    const api = createApiMock();
    const options = sitesQueryOptions(api);

    expect(options.queryKey).toEqual(["monitoredAreas", "sites"]);
    expect(options.queryFn).toBe(api.getSites);

    await api.getSites();

    expect(api.getSites).toHaveBeenCalledTimes(1);
  });

  it("defines the Rooms query through the monitored areas API", async () => {
    const api = createApiMock();
    const options = roomsQueryOptions(api);

    expect(options.queryKey).toEqual(["monitoredAreas", "rooms"]);
    expect(options.queryFn).toBe(api.getRooms);

    await api.getRooms();

    expect(api.getRooms).toHaveBeenCalledTimes(1);
  });

  it("defines the Sensors query through the monitored areas API", async () => {
    const api = createApiMock();
    const options = sensorsQueryOptions(api);

    expect(options.queryKey).toEqual(["monitoredAreas", "sensors"]);
    expect(options.queryFn).toBe(api.getSensors);

    await api.getSensors();

    expect(api.getSensors).toHaveBeenCalledTimes(1);
  });

  it("keeps the three resource caches isolated under one feature namespace", () => {
    const siteKey = monitoredAreasQueryKeys.sites();
    const roomKey = monitoredAreasQueryKeys.rooms();
    const sensorKey = monitoredAreasQueryKeys.sensors();

    expect(siteKey).not.toEqual(roomKey);
    expect(siteKey).not.toEqual(sensorKey);
    expect(roomKey).not.toEqual(sensorKey);

    expect(siteKey[0]).toBe(monitoredAreasQueryKeys.all[0]);
    expect(roomKey[0]).toBe(monitoredAreasQueryKeys.all[0]);
    expect(sensorKey[0]).toBe(monitoredAreasQueryKeys.all[0]);
  });
});
