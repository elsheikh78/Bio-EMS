import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  createCustomerPlatformBackup,
  getCustomerPlatformBackupSchedule,
  getCustomerPlatformRestoreJob,
  listCustomerPlatformBackups,
  restoreCustomerPlatformBackup,
  updateCustomerPlatformBackupSchedule,
} from "../controllers/platform-backup.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody } from "../middleware/validate-request";
import { platformBackupScheduleInputSchema } from "../modules/platform-backup/platform-backup-schedule.schema";

const router = Router();

router.get(
  "/schedule",
  requirePermission(PERMISSION.PLATFORM_BACKUP_READ),
  getCustomerPlatformBackupSchedule
);

router.put(
  "/schedule",
  requirePermission(PERMISSION.PLATFORM_BACKUP_MANAGE),
  validateBody(platformBackupScheduleInputSchema),
  updateCustomerPlatformBackupSchedule
);

router.post(
  "/",
  requirePermission(PERMISSION.PLATFORM_BACKUP_MANAGE),
  createCustomerPlatformBackup
);

router.post(
  "/:backupId/restore",
  requirePermission(PERMISSION.PLATFORM_BACKUP_MANAGE),
  restoreCustomerPlatformBackup
);

router.get(
  "/restore-jobs/:jobId",
  requirePermission(PERMISSION.PLATFORM_BACKUP_READ),
  getCustomerPlatformRestoreJob
);

router.get("/", requirePermission(PERMISSION.PLATFORM_BACKUP_READ), listCustomerPlatformBackups);

export default router;
