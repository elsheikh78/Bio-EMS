import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  createCustomerPlatformBackup,
  getCustomerPlatformRestoreJob,
  listCustomerPlatformBackups,
  restoreCustomerPlatformBackup,
} from "../controllers/platform-backup.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

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
