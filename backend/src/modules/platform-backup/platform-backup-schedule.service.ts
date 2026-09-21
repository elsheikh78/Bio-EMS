import { sqlite } from "../../../database/sqlite/client";
import type { PlatformBackupScheduleInput } from "./platform-backup-schedule.schema";

export interface PlatformBackupSchedule {
  enabled: boolean;
  intervalHours: 6 | 12 | 24 | 168;
  retentionCount: number;
  nextRunAt: string | null;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastFailure: string | null;
  updatedAt: string;
  updatedBy: string;
}

interface ScheduleRow {
  enabled: number;
  interval_hours: number;
  retention_count: number;
  next_run_at: string | null;
  last_started_at: string | null;
  last_completed_at: string | null;
  last_failure: string | null;
  updated_at: string;
  updated_by: string;
}

function mapSchedule(row: ScheduleRow): PlatformBackupSchedule {
  return {
    enabled: row.enabled === 1,
    intervalHours: row.interval_hours as PlatformBackupSchedule["intervalHours"],
    retentionCount: row.retention_count,
    nextRunAt: row.next_run_at,
    lastStartedAt: row.last_started_at,
    lastCompletedAt: row.last_completed_at,
    lastFailure: row.last_failure,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function getPlatformBackupSchedule(): PlatformBackupSchedule {
  const row = sqlite
    .prepare("SELECT * FROM platform_backup_schedule WHERE id = 1")
    .get() as ScheduleRow | undefined;
  if (!row) throw new Error("Platform backup schedule is not initialized");
  return mapSchedule(row);
}

function nextRun(now: Date, intervalHours: number): string {
  return new Date(now.getTime() + intervalHours * 60 * 60 * 1000).toISOString();
}

export function updatePlatformBackupSchedule(
  input: PlatformBackupScheduleInput,
  updatedBy: string,
  now = new Date()
): PlatformBackupSchedule {
  const timestamp = now.toISOString();
  sqlite
    .prepare(
      `UPDATE platform_backup_schedule
       SET enabled = ?, interval_hours = ?, retention_count = ?,
           next_run_at = ?, last_failure = NULL, updated_at = ?, updated_by = ?
       WHERE id = 1`
    )
    .run(
      input.enabled ? 1 : 0,
      input.intervalHours,
      input.retentionCount,
      input.enabled ? nextRun(now, input.intervalHours) : null,
      timestamp,
      updatedBy
    );
  return getPlatformBackupSchedule();
}

export function claimDuePlatformBackup(now = new Date()): PlatformBackupSchedule | null {
  return sqlite.transaction(() => {
    const schedule = getPlatformBackupSchedule();
    if (!schedule.enabled || !schedule.nextRunAt || schedule.nextRunAt > now.toISOString()) {
      return null;
    }
    const startedAt = now.toISOString();
    const result = sqlite
      .prepare(
        `UPDATE platform_backup_schedule
         SET last_started_at = ?, next_run_at = ?, last_failure = NULL
         WHERE id = 1 AND enabled = 1 AND next_run_at = ?`
      )
      .run(startedAt, nextRun(now, schedule.intervalHours), schedule.nextRunAt);
    return result.changes === 1 ? getPlatformBackupSchedule() : null;
  })();
}

export function completeScheduledPlatformBackup(now = new Date()): void {
  sqlite
    .prepare(
      `UPDATE platform_backup_schedule
       SET last_completed_at = ?, last_failure = NULL
       WHERE id = 1`
    )
    .run(now.toISOString());
}

export function failScheduledPlatformBackup(error: unknown): void {
  const message = error instanceof Error ? error.message : "Automatic backup failed";
  sqlite
    .prepare(
      `UPDATE platform_backup_schedule
       SET last_failure = ?
       WHERE id = 1`
    )
    .run(message.slice(0, 1000));
}
