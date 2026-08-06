export interface TelemetrySensorDto {
  channel: number;
  value: number;
}

export interface TelemetryDto {
  protocolVersion: string;
  timestamp: string;

  battery: number;
  signal: number;

  sensors: TelemetrySensorDto[];
}
