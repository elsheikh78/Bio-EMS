import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { migration029 } from "../../../database/sqlite/migrations/029_create_platform_backup_schedule";
import { platformBackupScheduleInputSchema } from "./platform-backup-schedule.schema";

describe("platform backup schedule", () => {
  it("creates a disabled durable schedule with safe defaults", () => {
    const database = new Database(":memory:");
    migration029.up(database);
    const row = database
      .prepare("SELECT * FROM platform_backup_schedule WHERE id = 1")
      .get() as Record<string, unknown>;

    expect(row.enabled).toBe(0);
    expect(row.interval_hours).toBe(24);
    expect(row.retention_count).toBe(7);
    expect(row.next_run_at).toBeNull();
  });

  it.each([6, 12, 24, 168])("accepts the supported %s-hour interval", (intervalHours) => {
    expect(
      platformBackupScheduleInputSchema.parse({
        enabled: true,
        intervalHours,
        retentionCount: 7,
      })
    ).toEqual({ enabled: true, intervalHours, retentionCount: 7 });
  });

  it("rejects unsupported frequency and retention values", () => {
    expect(() =>
      platformBackupScheduleInputSchema.parse({
        enabled: true,
        intervalHours: 1,
        retentionCount: 0,
      })
    ).toThrow();
  });

  it("enforces schedule constraints in persistent storage", () => {
    const database = new Database(":memory:");
    migration029.up(database);
    expect(() =>
      database
        .prepare(
          "UPDATE platform_backup_schedule SET interval_hours = 1, retention_count = 0 WHERE id = 1"
        )
        .run()
    ).toThrow();
  });
});
