import { sqlite } from "./client";

export function runMigrations(): void {

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (

            version INTEGER PRIMARY KEY,

            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP

        );
    `);

    console.log("Migration System Ready");
}