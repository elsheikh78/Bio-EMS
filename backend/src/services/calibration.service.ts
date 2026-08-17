import type { CalibrationRecord } from "../entities/CalibrationRecord";
import { AppError } from "../errors/app-error";
import type { CreateCalibrationRecordInput } from "../modules/calibration/dto/calibration.schema";
import { CalibrationRepository } from "../repositories/calibration.repository";

const repository = new CalibrationRepository();
const sensorNotFound = () => new AppError("Sensor not found", 404, "SENSOR_NOT_FOUND");

export function createCalibrationRecord(
  sensorUuid: string,
  input: CreateCalibrationRecordInput,
  performedByUserId: number
): CalibrationRecord {
  const record = repository.create(sensorUuid, input, performedByUserId);
  if (!record) throw sensorNotFound();
  return record;
}

export function getCalibrationHistory(sensorUuid: string): CalibrationRecord[] {
  const records = repository.listBySensorUuid(sensorUuid);
  if (!records) throw sensorNotFound();
  return records;
}
