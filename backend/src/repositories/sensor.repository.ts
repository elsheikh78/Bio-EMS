import { sqlite } from "../../database/sqlite/client";

export interface Sensor {
    id?: number;

    uuid: string;

    room_id: number;

    device_id: number;

    channel: number;

    code: string;

    name: string;

    sensor_type: string;

    unit: string;

    min_value?: number;

    max_value?: number;

    alarm_low?: number;

    alarm_high?: number;

    enabled?: number;

    created_at?: string;

    updated_at?: string;
}

export class SensorRepository {

    create(sensor: Sensor): number {

        const stmt = sqlite.prepare(`
            INSERT INTO sensors
            (
                uuid,
                room_id,
                device_id,
                channel,
                code,
                name,
                sensor_type,
                unit,
                min_value,
                max_value,
                alarm_low,
                alarm_high,
                enabled
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            sensor.uuid,
            sensor.room_id,
            sensor.device_id,
            sensor.channel,
            sensor.code,
            sensor.name,
            sensor.sensor_type,
            sensor.unit,
            sensor.min_value ?? null,
            sensor.max_value ?? null,
            sensor.alarm_low ?? null,
            sensor.alarm_high ?? null,
            sensor.enabled ?? 1
        );

        return Number(result.lastInsertRowid);
    }

    getAll(): Sensor[] {

        const stmt = sqlite.prepare(`
            SELECT *
            FROM sensors
            ORDER BY id
        `);

        return stmt.all() as Sensor[];
    }

}