import { SensorType } from "../enums/sensor-type";

export type SensorReading = {
  sensorType: SensorType;
  value: number | null;
};
