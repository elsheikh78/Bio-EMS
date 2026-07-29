import { sqlite } from "./client";

export function createTables(): void {

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

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS devices (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            uuid TEXT NOT NULL UNIQUE,

            device_id TEXT NOT NULL UNIQUE,

            site_id INTEGER NOT NULL,

            device_type TEXT NOT NULL,

            protocol TEXT NOT NULL,

            manufacturer TEXT,

            model TEXT,

            firmware_version TEXT,

            status TEXT NOT NULL DEFAULT 'pending',

            activated INTEGER NOT NULL DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME,

            FOREIGN KEY (site_id)
                REFERENCES sites(id)

        );
    `);

    console.log("Devices table ready");

    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS rooms (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            uuid TEXT NOT NULL UNIQUE,

            site_id INTEGER NOT NULL,

            code TEXT NOT NULL,

            name TEXT NOT NULL,

            description TEXT,

            active INTEGER NOT NULL DEFAULT 1,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME,

            FOREIGN KEY (site_id)
                REFERENCES sites(id),

            UNIQUE(site_id, code)

        );
    `);

    console.log("Rooms table ready");

    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sensors (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        uuid TEXT NOT NULL UNIQUE,

        room_id INTEGER NOT NULL,

        device_id INTEGER NOT NULL,

        channel INTEGER NOT NULL,

        code TEXT NOT NULL,

        name TEXT NOT NULL,

        sensor_type TEXT NOT NULL,

        unit TEXT NOT NULL,

        min_value REAL,

        max_value REAL,

        alarm_low REAL,

        alarm_high REAL,

        enabled INTEGER NOT NULL DEFAULT 1,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME,

        FOREIGN KEY (room_id)
            REFERENCES rooms(id),

        FOREIGN KEY (device_id)
            REFERENCES devices(id),

        UNIQUE(device_id, channel),

        UNIQUE(room_id, code)

    );
`);

console.log("Sensors table ready");

}