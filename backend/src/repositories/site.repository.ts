import { sqlite } from "../../database/sqlite/client";

export interface Site {

    id?: number;

    code: string;

    name: string;

    location?: string;

    timezone?: string;

    active?: number;

}

export class SiteRepository {

    create(site: Site): number {

        const stmt = sqlite.prepare(`
            INSERT INTO sites
            (
                code,
                name,
                location,
                timezone,
                active
            )
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            site.code,
            site.name,
            site.location ?? null,
            site.timezone ?? null,
            site.active ?? 1
        );

        return Number(result.lastInsertRowid);

    }

    getAll(): Site[] {

        const stmt = sqlite.prepare(`
            SELECT *
            FROM sites
            ORDER BY id
        `);

        return stmt.all() as Site[];

    }

    findById(id: number): Site | undefined {

        const stmt = sqlite.prepare(`
            SELECT *
            FROM sites
            WHERE id = ?
            LIMIT 1
        `);

        return stmt.get(id) as Site | undefined;

    }

}