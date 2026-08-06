import { sqlite } from "../../database/sqlite/client";

export interface Device {
  id?: number;

  uuid: string;

  device_id: string;

  site_id: number;

  device_type: string;

  protocol: string;

  manufacturer?: string;

  model?: string;

  firmware_version?: string;

  status?: string;

  activated?: number;

  created_at?: string;

  updated_at?: string;
}

export class DeviceRepository {
  create(device: Device): number {
    const stmt = sqlite.prepare(`
            INSERT INTO devices
            (
                uuid,
                device_id,
                site_id,
                device_type,
                protocol,
                manufacturer,
                model,
                firmware_version,
                status,
                activated
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    const result = stmt.run(
      device.uuid,

      device.device_id,

      device.site_id,

      device.device_type,

      device.protocol,

      device.manufacturer ?? null,

      device.model ?? null,

      device.firmware_version ?? null,

      device.status ?? "pending",

      device.activated ?? 0
    );

    return Number(result.lastInsertRowid);
  }

  getAll(): Device[] {
    const stmt = sqlite.prepare(`
            SELECT *
            FROM devices
            ORDER BY id
        `);

    return stmt.all() as Device[];
  }

  findByDeviceId(deviceId: string): Device | undefined {
    const stmt = sqlite.prepare(`
            SELECT *
            FROM devices
            WHERE device_id = ?
            LIMIT 1
        `);

    return stmt.get(deviceId) as Device | undefined;
  }
}
