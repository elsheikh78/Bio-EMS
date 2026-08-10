import type Database from "better-sqlite3";

export const migration003 = {
  version: 3,

  description: "Create users table",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL
          CHECK(length(username) BETWEEN 3 AND 64)
          CHECK(username = lower(trim(username)))
          CHECK(username NOT GLOB '*[^a-z0-9._-]*'),
        email TEXT,
        password_hash TEXT NOT NULL CHECK(length(password_hash) > 0),
        role TEXT NOT NULL CHECK(role IN ('ADMIN', 'OPERATOR', 'VIEWER')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
        ON users(username);
    `);
  },
};
