import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as sensorController from "../controllers/sensor.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.post("/", requirePermission(PERMISSION.CONFIGURATION_WRITE), sensorController.createSensor);

router.get("/", requirePermission(PERMISSION.CONFIGURATION_READ), sensorController.getSensors);

export default router;
