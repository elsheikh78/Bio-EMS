import type Database from "better-sqlite3";

export const migration007 = {
  version: 7,
  description: "Add Device communication health timestamps",

  up(database: Database.Database): void {
    const columns = new Set(
      (database.prepare("PRAGMA table_info(devices)").all() as Array<{ name: string }>).map(
        (column) => column.name
      )
    );

    if (!columns.has("last_seen_at")) {
      database.exec("ALTER TABLE devices ADD COLUMN last_seen_at TEXT;");
    }
    if (!columns.has("last_heartbeat_at")) {
      database.exec("ALTER TABLE devices ADD COLUMN last_heartbeat_at TEXT;");
    }
  },
};
