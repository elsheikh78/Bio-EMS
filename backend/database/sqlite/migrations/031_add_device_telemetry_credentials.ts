import type { Migration } from "../migration-runner";

export const migration031: Migration = {
  version: 31,
  description: "Add per-binding device telemetry credential hashes",
  up(database) {
    database.exec(`ALTER TABLE device_platform_bindings ADD COLUMN telemetry_token_hash TEXT;`);
  },
};
