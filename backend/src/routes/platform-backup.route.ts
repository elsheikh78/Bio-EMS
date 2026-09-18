import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  createCustomerPlatformBackup,
  listCustomerPlatformBackups,
} from "../controllers/platform-backup.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.post(
  "/",
  requirePermission(PERMISSION.PLATFORM_BACKUP_MANAGE),
  createCustomerPlatformBackup
);

router.get("/", requirePermission(PERMISSION.PLATFORM_BACKUP_READ), listCustomerPlatformBackups);

export default router;
