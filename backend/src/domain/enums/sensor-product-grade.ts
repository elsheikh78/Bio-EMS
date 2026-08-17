export const SENSOR_PRODUCT_GRADES = ["STANDARD", "ADVANCED"] as const;

export type SensorProductGrade = (typeof SENSOR_PRODUCT_GRADES)[number];
