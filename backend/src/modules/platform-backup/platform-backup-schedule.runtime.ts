import {
  createCompletePlatformBackup,
  prunePlatformBackups,
} from "./platform-backup.service";
import {
  claimDuePlatformBackup,
  completeScheduledPlatformBackup,
  failScheduledPlatformBackup,
} from "./platform-backup-schedule.service";

const POLL_INTERVAL_MS = 60_000;

export function startPlatformBackupScheduleRuntime(): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;
    const schedule = claimDuePlatformBackup();
    if (!schedule) return;

    running = true;
    try {
      await createCompletePlatformBackup();
      await prunePlatformBackups(schedule.retentionCount);
      completeScheduledPlatformBackup();
    } catch (error) {
      failScheduledPlatformBackup(error);
      console.error("Scheduled BIO-EMS platform backup failed", error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
