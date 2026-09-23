import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";

export interface ActiveDevicePlatformBinding {
  platform_binding_id: string;
  device_identity: string;
  hardware_uid: string;
  site_code: string;
  firmware_version: string;
  protocol_version: string;
}

export class DevicePlatformBindingRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  findActiveByDeviceIdentity(deviceIdentity: string): ActiveDevicePlatformBinding | undefined {
    return this.database
      .prepare(
        `SELECT
           platform_binding_id,
           device_identity,
           hardware_uid,
           site_code,
           firmware_version,
           protocol_version
         FROM device_platform_bindings
         WHERE device_identity=? AND status='ACTIVE'
         LIMIT 1`
      )
      .get(deviceIdentity) as ActiveDevicePlatformBinding | undefined;
  }
}
