import type Database from "better-sqlite3";

export const migration002 = {
  version: 2,

  description: "Add warning thresholds to sensors table",

  up(database: Database.Database): void {
    const columns = database.prepare("PRAGMA table_info(sensors)").all() as Array<{ name: string }>;

    const columnNames = columns.map((column) => column.name);

    if (!columnNames.includes("warning_low")) {
      database.exec(`
                ALTER TABLE sensors
                ADD COLUMN warning_low REAL;
            `);

      console.log("Added column: warning_low");
    }

    if (!columnNames.includes("warning_high")) {
      database.exec(`
                ALTER TABLE sensors
                ADD COLUMN warning_high REAL;
            `);

      console.log("Added column: warning_high");
    }
  },
};
