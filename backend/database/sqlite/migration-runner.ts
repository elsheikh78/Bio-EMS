import type Database from "better-sqlite3";
import { sqlite } from "./client";
import { MigrationRepository } from "./migration.repository";

import { migration001 } from "./migrations/001_initial_schema";
import { migration002 } from "./migrations/002_add_warning_thresholds";
import { migration003 } from "./migrations/003_create_users";

export interface Migration {
  version: number;

  description: string;

  up(database: Database.Database): void;
}

const migrations: Migration[] = [migration001, migration002, migration003];

export function runMigrations(
  database: Database.Database = sqlite,
  registeredMigrations: Migration[] = migrations
): void {
  ensureMigrationTable(database);

  const repository = new MigrationRepository(database);

  for (const migration of registeredMigrations) {
    if (repository.hasMigration(migration.version)) {
      continue;
    }

    console.log(`Running migration ${migration.version}: ${migration.description}`);

    database.transaction(() => {
      migration.up(database);
      repository.recordMigration(migration.version, migration.description);
    })();

    console.log(`Migration ${migration.version} completed`);
  }
}

function ensureMigrationTable(database: Database.Database): void {
  database.exec(`

        CREATE TABLE IF NOT EXISTS schema_migrations (

            version INTEGER PRIMARY KEY,

            description TEXT NOT NULL,

            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP

        );

    `);
}
