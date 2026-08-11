import type Database from "better-sqlite3";

export const migration004 = {
  version: 4,

  description: "Add acknowledging user to alarms",

  up(database: Database.Database): void {
    const columns = database.prepare("PRAGMA table_info(alarms)").all() as Array<{ name: string }>;

    if (!columns.some((column) => column.name === "acknowledged_by_user_id")) {
      database.exec(`
        ALTER TABLE alarms
        ADD COLUMN acknowledged_by_user_id INTEGER
          REFERENCES users(id)
          ON DELETE SET NULL;
      `);
    }
  },
};
