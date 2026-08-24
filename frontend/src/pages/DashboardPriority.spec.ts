import { describe, expect, it } from "vitest";
import type { DashboardRoomStatus } from "../dashboard/contracts";
import { roomOperationalPriority } from "../dashboard/roomPriority";

function room(
  temperatureStatus: DashboardRoomStatus["temperatureStatus"],
  humidityStatus: DashboardRoomStatus["humidityStatus"],
): DashboardRoomStatus {
  return {
    roomId: 1,
    roomName: "Cold Room 1",
    siteId: 1,
    siteName: "Main Warehouse",
    temperature: 9,
    humidity: null,
    temperatureStatus,
    humidityStatus,
    activeAlarms: 0,
    online: true,
    lastUpdate: "2026-08-24T10:00:00.000Z",
  };
}

describe("Dashboard Priority areas", () => {
  it("prioritizes a critical current Sensor state even after its Alarm is acknowledged", () => {
    expect(roomOperationalPriority(room("CRITICAL", "UNKNOWN"))).toBeGreaterThan(
      roomOperationalPriority(room("NORMAL", "UNKNOWN")),
    );
  });
});
