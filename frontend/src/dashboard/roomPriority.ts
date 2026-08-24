import type {
  DashboardRoomStatus,
  DashboardSensorStatus,
} from "./contracts";

const ROOM_PRIORITY: Record<DashboardSensorStatus, number> = {
  UNKNOWN: 0,
  NORMAL: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export function roomOperationalPriority(room: DashboardRoomStatus): number {
  return Math.max(
    ROOM_PRIORITY[room.temperatureStatus],
    ROOM_PRIORITY[room.humidityStatus],
  );
}

export function roomPriorityTone(
  room: DashboardRoomStatus,
): "error.main" | "warning.main" | "success.main" {
  const operationalPriority = roomOperationalPriority(room);

  if (!room.online || operationalPriority === ROOM_PRIORITY.CRITICAL) {
    return "error.main";
  }

  if (
    operationalPriority === ROOM_PRIORITY.WARNING ||
    room.activeAlarms > 0
  ) {
    return "warning.main";
  }

  return "success.main";
}
