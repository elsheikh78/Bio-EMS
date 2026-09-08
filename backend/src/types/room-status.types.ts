export interface RoomStatus {
  roomId: number;

  roomName: string;

  siteId: number;

  siteName: string;

  temperature: number | null;

  temperatureUnit: string | null;

  temperatureRange: {
    min: number | null;
    max: number | null;
  } | null;

  temperatureLast24Hours: {
    min: number;
    max: number;
    trend: number[];
  } | null;

  humidity: number | null;

  temperatureStatus: "NORMAL" | "WARNING" | "CRITICAL" | "UNKNOWN";

  humidityStatus: "NORMAL" | "WARNING" | "CRITICAL" | "UNKNOWN";

  activeAlarms: number;

  sensorCount: number;

  online: boolean;

  lastUpdate: string | null;
}
