/**
 * BIO-EMS Dashboard Types
 * Sprint 10
 */

export interface DashboardSummary {
  totalSites: number;
  totalRooms: number;
  totalDevices: number;
  totalSensors: number;
  activeAlarms: number;
  offlineDevices: number;
}

export interface RoomStatus {
  roomId: number;
  roomName: string;
  siteId: number;
  status: "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  temperature: number | null;
  humidity: number | null;
  lastUpdate: string | null;
}

export interface LatestTelemetry {
  sensorId: number;
  sensorName: string;
  roomId: number;
  roomName: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface AlarmStatistics {
  total: number;
  active: number;
  acknowledged: number;
  recovered: number;
  critical: number;
  warning: number;
}