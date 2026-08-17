import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as sensorController from "../controllers/sensor.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateQuery } from "../middleware/validate-request";
import { createSensorSchema, sensorListQuerySchema } from "../modules/sensor/dto/sensor.schema";

const router = Router();

router.post(
  "/",
  requirePermission(PERMISSION.CONFIGURATION_WRITE),
  validateBody(createSensorSchema),
  sensorController.createSensor
);

router.get(
  "/",
  requirePermission(PERMISSION.CONFIGURATION_READ),
  validateQuery(sensorListQuerySchema),
  sensorController.getSensors
);

export default router;
