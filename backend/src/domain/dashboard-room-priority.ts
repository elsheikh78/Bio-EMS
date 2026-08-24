import type { RoomStatus } from "../types/room-status.types";

const ROOM_STATUS_PRIORITY: Record<RoomStatus["temperatureStatus"], number> = {
  UNKNOWN: 0,
  NORMAL: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export function shouldReplaceRoomSnapshot(
  currentStatus: RoomStatus["temperatureStatus"],
  candidateStatus: RoomStatus["temperatureStatus"],
  currentTime: string,
  candidateTime: string
): boolean {
  const priorityDifference =
    ROOM_STATUS_PRIORITY[candidateStatus] - ROOM_STATUS_PRIORITY[currentStatus];

  return priorityDifference > 0 || (priorityDifference === 0 && candidateTime > currentTime);
}
