import { Router } from "express";
import * as alarmController from "../controllers/alarm.controller";

const router = Router();

router.get("/", alarmController.getAlarms);

router.get("/active", alarmController.getActiveAlarms);

router.get("/:id", alarmController.getAlarmById);

router.post("/:id/acknowledge", alarmController.acknowledgeAlarm);

export default router;
