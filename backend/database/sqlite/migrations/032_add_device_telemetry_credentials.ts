import type { Migration } from "../migration-runner";

export const migration032: Migration = {
  version: 32,
  description: "Add per-binding device telemetry credential hashes",
  up(database) {
    database.exec(`ALTER TABLE device_platform_bindings ADD COLUMN telemetry_token_hash TEXT;`);
  },
};
