import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as alarmController from "../controllers/alarm.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.get("/", requirePermission(PERMISSION.ALARM_READ), alarmController.getAlarms);

router.get("/active", requirePermission(PERMISSION.ALARM_READ), alarmController.getActiveAlarms);

router.get("/:id", requirePermission(PERMISSION.ALARM_READ), alarmController.getAlarmById);

router.post(
  "/:id/acknowledge",
  requirePermission(PERMISSION.ALARM_ACKNOWLEDGE),
  alarmController.acknowledgeAlarm
);

export default router;
