import type { CalibrationResult } from "../domain/enums/calibration-result";

export interface CalibrationRecord {
  id: number;
  sensor_id: number;
  sensor_uuid: string;
  result: CalibrationResult;
  performed_at: string;
  due_at: string | null;
  offset: number | null;
  certificate_reference: string | null;
  notes: string | null;
  performed_by_user_id: number;
  performed_by_username: string;
  created_at: string;
}
