import type Database from "better-sqlite3";

export const migration009 = {
  version: 9,
  description: "Create isolated platform principal credential storage",

  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS platform_principals (
        id TEXT PRIMARY KEY,
        principal_type TEXT NOT NULL CHECK(principal_type = 'SYSTEM_OWNER'),
        username TEXT NOT NULL
          CHECK(length(username) BETWEEN 3 AND 64)
          CHECK(username = lower(trim(username)))
          CHECK(username NOT GLOB '*[^a-z0-9._-]*'),
        password_hash TEXT NOT NULL CHECK(length(password_hash) > 0),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_principals_username
        ON platform_principals(username);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_principals_system_owner_singleton
        ON platform_principals(principal_type)
        WHERE principal_type = 'SYSTEM_OWNER';
    `);
  },
};
