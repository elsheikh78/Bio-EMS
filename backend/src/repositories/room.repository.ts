import { sqlite } from "../../database/sqlite/client";

export interface Room {
    id?: number;
    uuid: string;
    site_id: number;
    code: string;
    name: string;
    description?: string;
    active?: number;
    created_at?: string;
    updated_at?: string;
}

export class RoomRepository {

    create(room: Room): number {

        const stmt = sqlite.prepare(`
            INSERT INTO rooms
            (
                uuid,
                site_id,
                code,
                name,
                description,
                active
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            room.uuid,
            room.site_id,
            room.code,
            room.name,
            room.description ?? null,
            room.active ?? 1
        );

        return Number(result.lastInsertRowid);
    }

    getAll(): Room[] {

        const stmt = sqlite.prepare(`
            SELECT *
            FROM rooms
            ORDER BY id
        `);

        return stmt.all() as Room[];
    }

}