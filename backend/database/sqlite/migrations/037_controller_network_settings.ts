import type Database from "better-sqlite3";
export const migration037 = {
  version: 37,
  description: "Encrypted per-controller Wi-Fi settings",
  up(db: Database.Database): void {
    db.exec(`CREATE TABLE controller_network_credentials (
      binding_id TEXT PRIMARY KEY REFERENCES device_platform_bindings(platform_binding_id),
      encrypted TEXT NOT NULL, updated_at TEXT NOT NULL
    );`);
  },
};
