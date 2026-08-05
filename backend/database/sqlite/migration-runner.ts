import { sqlite } from "./client";
import { MigrationRepository } from "./migration.repository";

import { migration001 } from "./migrations/001_initial_schema";
import { migration002 } from "./migrations/002_add_warning_thresholds";

export interface Migration {

    version: number;

    description: string;

    up(): void;

}

const migrations: Migration[] = [

    migration001,

    migration002

];

export function runMigrations(): void {

    ensureMigrationTable();

    const repository = new MigrationRepository();

    for (const migration of migrations) {

        if (repository.hasMigration(migration.version)) {

            continue;

        }

        console.log(
            `Running migration ${migration.version}: ${migration.description}`
        );

        migration.up();

        repository.recordMigration(

            migration.version,

            migration.description

        );

        console.log(
            `Migration ${migration.version} completed`
        );

    }

}

function ensureMigrationTable(): void {

    sqlite.exec(`

        CREATE TABLE IF NOT EXISTS schema_migrations (

            version INTEGER PRIMARY KEY,

            description TEXT NOT NULL,

            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP

        );

    `);

}