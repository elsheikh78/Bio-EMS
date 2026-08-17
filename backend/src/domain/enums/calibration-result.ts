export const CALIBRATION_RESULTS = ["PASS", "FAIL"] as const;

export type CalibrationResult = (typeof CALIBRATION_RESULTS)[number];
