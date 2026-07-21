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

    create(site: Site): void {

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

        stmt.run(
            site.code,
            site.name,
            site.location ?? null,
            site.timezone ?? null,
            site.active ?? 1
        );
    }

    getAll(): Site[] {

        const stmt = sqlite.prepare(`
            SELECT *
            FROM sites
            ORDER BY id
        `);

        return stmt.all() as Site[];
    }

}