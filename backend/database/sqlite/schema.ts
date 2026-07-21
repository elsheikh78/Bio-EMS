import { sqlite } from "./client";

export function createTables() {

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            code TEXT NOT NULL UNIQUE,

            name TEXT NOT NULL,

            location TEXT,

            timezone TEXT,

            active INTEGER DEFAULT 1,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Sites table ready");
}