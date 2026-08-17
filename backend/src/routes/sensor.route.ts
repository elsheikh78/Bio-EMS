import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as sensorController from "../controllers/sensor.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  calibrationListQuerySchema,
  createCalibrationRecordSchema,
  sensorCalibrationParamsSchema,
} from "../modules/calibration/dto/calibration.schema";
import { createSensorSchema, sensorListQuerySchema } from "../modules/sensor/dto/sensor.schema";

const router = Router();

router.post(
  "/:sensorUuid/calibrations",
  requirePermission(PERMISSION.CONFIGURATION_WRITE),
  validateParams(sensorCalibrationParamsSchema),
  validateBody(createCalibrationRecordSchema),
  sensorController.createCalibrationRecord
);

router.get(
  "/:sensorUuid/calibrations",
  requirePermission(PERMISSION.CONFIGURATION_READ),
  validateParams(sensorCalibrationParamsSchema),
  validateQuery(calibrationListQuerySchema),
  sensorController.getCalibrationHistory
);

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
