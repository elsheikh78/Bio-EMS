export const SENSOR_CALIBRATION_STATUSES = ["NOT_CALIBRATED", "VALID", "DUE", "EXPIRED"] as const;

export type SensorCalibrationStatus = (typeof SENSOR_CALIBRATION_STATUSES)[number];
