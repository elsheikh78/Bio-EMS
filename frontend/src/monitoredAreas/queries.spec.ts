import { describe, expect, it } from "vitest";
import { monitoredAreasQueryKeys } from "./queries";

describe("monitored areas queries", () => {
  it("defines the monitored areas feature query namespace", () => {
    expect(monitoredAreasQueryKeys.all).toEqual(["monitoredAreas"]);
  });

  it("defines a stable Sites query key", () => {
    expect(monitoredAreasQueryKeys.sites()).toEqual([
      "monitoredAreas",
      "sites",
    ]);
  });

  it("defines a stable Rooms query key", () => {
    expect(monitoredAreasQueryKeys.rooms()).toEqual([
      "monitoredAreas",
      "rooms",
    ]);
  });

  it("defines a stable Sensors query key", () => {
    expect(monitoredAreasQueryKeys.sensors()).toEqual([
      "monitoredAreas",
      "sensors",
    ]);
  });

  it("keeps resource caches isolated under the feature namespace", () => {
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
