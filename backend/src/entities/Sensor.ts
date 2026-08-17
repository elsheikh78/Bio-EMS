import type { SensorCalibrationStatus } from "../domain/enums/sensor-calibration-status";
import type { SensorProductGrade } from "../domain/enums/sensor-product-grade";

export interface Sensor {
  id?: number;

  uuid: string;

  room_id: number;

  device_id: number;

  channel: number;

  code: string;

  name: string;

  sensor_type: string;

  unit: string;

  min_value?: number;

  max_value?: number;

  warning_low?: number;

  alarm_low?: number;

  warning_high?: number;

  alarm_high?: number;

  product_grade?: SensorProductGrade;

  hardware_model?: string;

  installation_date?: string;

  calibration_status?: SensorCalibrationStatus;

  last_calibrated_at?: string;

  calibration_due_at?: string;

  calibration_offset?: number;

  certificate_reference?: string;

  enabled?: number;

  created_at?: string;

  updated_at?: string;
}
