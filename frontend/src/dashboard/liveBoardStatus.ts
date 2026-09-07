import type { DashboardRoomStatus } from "./contracts";

export type LiveBoardStatus = "NORMAL" | "WARNING" | "ALARM" | "OFFLINE";

export function deriveLiveBoardStatus(
  room: DashboardRoomStatus,
): LiveBoardStatus {
  if (!room.online) return "OFFLINE";
  if (
    room.activeAlarms > 0 ||
    room.temperatureStatus === "CRITICAL" ||
    room.humidityStatus === "CRITICAL"
  ) {
    return "ALARM";
  }
  if (
    room.temperatureStatus === "WARNING" ||
    room.humidityStatus === "WARNING"
  ) {
    return "WARNING";
  }
  return "NORMAL";
}
