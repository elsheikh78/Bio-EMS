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