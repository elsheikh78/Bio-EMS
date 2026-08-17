import type Database from "better-sqlite3";

const sensorColumns = [
  [
    "product_grade",
    "TEXT NOT NULL DEFAULT 'STANDARD' CHECK(product_grade IN ('STANDARD', 'ADVANCED'))",
  ],
  ["hardware_model", "TEXT"],
  ["installation_date", "TEXT"],
  [
    "calibration_status",
    "TEXT NOT NULL DEFAULT 'NOT_CALIBRATED' CHECK(calibration_status IN ('NOT_CALIBRATED', 'VALID', 'DUE', 'EXPIRED'))",
  ],
  ["last_calibrated_at", "TEXT"],
  ["calibration_due_at", "TEXT"],
  ["calibration_offset", "REAL NOT NULL DEFAULT 0"],
  ["certificate_reference", "TEXT"],
] as const;

export const migration005 = {
  version: 5,

  description: "Add sensor lifecycle and calibration foundation",

  up(database: Database.Database): void {
    const existingColumns = new Set(
      (database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>).map(
        (column) => column.name
      )
    );

    for (const [name, definition] of sensorColumns) {
      if (!existingColumns.has(name)) {
        database.exec(`ALTER TABLE sensors ADD COLUMN ${name} ${definition};`);
      }
    }
  },
};
