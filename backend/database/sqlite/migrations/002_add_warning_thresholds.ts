import { sqlite } from "../client";

export const migration002 = {

    version: 2,

    description: "Add warning thresholds to sensors table",

    up(): void {

        const columns = sqlite
            .prepare("PRAGMA table_info(sensors)")
            .all() as Array<{ name: string }>;

        const columnNames = columns.map(column => column.name);

        if (!columnNames.includes("warning_low")) {

            sqlite.exec(`
                ALTER TABLE sensors
                ADD COLUMN warning_low REAL;
            `);

            console.log("Added column: warning_low");

        }

        if (!columnNames.includes("warning_high")) {

            sqlite.exec(`
                ALTER TABLE sensors
                ADD COLUMN warning_high REAL;
            `);

            console.log("Added column: warning_high");

        }

    }

};