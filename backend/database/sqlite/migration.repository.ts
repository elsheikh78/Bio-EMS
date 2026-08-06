import type Database from "better-sqlite3";
import { sqlite } from "./client";

export interface MigrationRecord {
  version: number;
  description: string;
  applied_at: string;
}

export class MigrationRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  getAppliedVersions(): number[] {
    const stmt = this.database.prepare(`
            SELECT version
            FROM schema_migrations
            ORDER BY version
        `);

    const rows = stmt.all() as Array<{ version: number }>;

    return rows.map((row) => row.version);
  }

  hasMigration(version: number): boolean {
    const stmt = this.database.prepare(`
            SELECT 1
            FROM schema_migrations
            WHERE version = ?
        `);

    const row = stmt.get(version);

    return row !== undefined;
  }

  recordMigration(version: number, description: string): void {
    const stmt = this.database.prepare(`
            INSERT INTO schema_migrations
            (
                version,
                description
            )
            VALUES
            (
                ?,
                ?
            )
        `);

    stmt.run(version, description);
  }
}
