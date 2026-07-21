export interface DeviceTelemetry {
  deviceId: string;
  temperature: number;
  humidity?: number;
  battery?: number;
  timestamp: string;
}