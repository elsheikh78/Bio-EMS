import { sqlite } from "./client";

export interface MigrationRecord {
    version: number;
    description: string;
    applied_at: string;
}

export class MigrationRepository {

    getAppliedVersions(): number[] {

        const stmt = sqlite.prepare(`
            SELECT version
            FROM schema_migrations
            ORDER BY version
        `);

        const rows = stmt.all() as Array<{ version: number }>;

        return rows.map(row => row.version);

    }

    hasMigration(version: number): boolean {

        const stmt = sqlite.prepare(`
            SELECT 1
            FROM schema_migrations
            WHERE version = ?
        `);

        const row = stmt.get(version);

        return row !== undefined;

    }

    recordMigration(
        version: number,
        description: string
    ): void {

        const stmt = sqlite.prepare(`
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

        stmt.run(
            version,
            description
        );

    }

}