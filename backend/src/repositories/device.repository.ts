import type Database from "better-sqlite3";
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

  last_seen_at?: string | null;

  last_heartbeat_at?: string | null;

  created_at?: string;

  updated_at?: string;
}

export type DeviceMetadataUpdate = Partial<
  Pick<Device, "device_type" | "protocol" | "manufacturer" | "model" | "firmware_version">
>;

export type DeviceLifecycleStatus = "pending" | "active" | "disabled";

export class DeviceRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(device: Device): number {
    const stmt = this.database.prepare(`
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
    const stmt = this.database.prepare(`
            SELECT *
            FROM devices
            ORDER BY id
        `);

    return stmt.all() as Device[];
  }

  findByDeviceId(deviceId: string): Device | undefined {
    const stmt = this.database.prepare(`
            SELECT *
            FROM devices
            WHERE device_id = ?
            LIMIT 1
        `);

    return stmt.get(deviceId) as Device | undefined;
  }

  updateMetadata(deviceId: string, update: DeviceMetadataUpdate): Device | undefined {
    const stmt = this.database.prepare(`
            UPDATE devices
            SET
                device_type = COALESCE(?, device_type),
                protocol = COALESCE(?, protocol),
                manufacturer = COALESCE(?, manufacturer),
                model = COALESCE(?, model),
                firmware_version = COALESCE(?, firmware_version),
                updated_at = CURRENT_TIMESTAMP
            WHERE device_id = ?
        `);

    const result = stmt.run(
      update.device_type ?? null,
      update.protocol ?? null,
      update.manufacturer ?? null,
      update.model ?? null,
      update.firmware_version ?? null,
      deviceId
    );

    if (result.changes === 0) {
      return undefined;
    }

    return this.findByDeviceId(deviceId);
  }

  transitionLifecycle(
    deviceId: string,
    expectedStatus: DeviceLifecycleStatus,
    expectedActivated: 0 | 1,
    nextStatus: DeviceLifecycleStatus,
    nextActivated: 0 | 1
  ): Device | undefined {
    const stmt = this.database.prepare(`
            UPDATE devices
            SET
                status = ?,
                activated = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE device_id = ?
            AND status = ?
            AND activated = ?
        `);

    const result = stmt.run(nextStatus, nextActivated, deviceId, expectedStatus, expectedActivated);

    if (result.changes === 0) {
      return undefined;
    }

    return this.findByDeviceId(deviceId);
  }

  recordCommunication(
    deviceId: string,
    receivedAt: string,
    kind: "telemetry" | "heartbeat"
  ): boolean {
    const result = this.database
      .prepare(
        kind === "heartbeat"
          ? `UPDATE devices
             SET last_seen_at = CASE
                   WHEN last_seen_at IS NULL OR last_seen_at < ? THEN ? ELSE last_seen_at END,
                 last_heartbeat_at = CASE
                   WHEN last_heartbeat_at IS NULL OR last_heartbeat_at < ?
                   THEN ? ELSE last_heartbeat_at END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE device_id = ? AND status = 'active' AND activated = 1`
          : `UPDATE devices
             SET last_seen_at = CASE
                   WHEN last_seen_at IS NULL OR last_seen_at < ? THEN ? ELSE last_seen_at END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE device_id = ? AND status = 'active' AND activated = 1`
      )
      .run(
        ...(kind === "heartbeat"
          ? [receivedAt, receivedAt, receivedAt, receivedAt, deviceId]
          : [receivedAt, receivedAt, deviceId])
      );

    return result.changes === 1;
  }
}
