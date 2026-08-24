import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as sensorController from "../controllers/sensor.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { requireAuditedPermission } from "../middleware/audited-authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  calibrationListQuerySchema,
  createCalibrationRecordSchema,
  sensorCalibrationParamsSchema,
} from "../modules/calibration/dto/calibration.schema";
import {
  createSensorSchema,
  sensorListQuerySchema,
  sensorThresholdParamsSchema,
  updateSensorThresholdsSchema,
} from "../modules/sensor/dto/sensor.schema";
import {
  SENSOR_THRESHOLD_AUDIT_ACTION,
  SENSOR_THRESHOLD_AUDIT_SOURCE,
} from "../modules/sensor/sensor-threshold-audit";

const router = Router();

router.patch(
  "/:sensorUuid/thresholds",
  requireAuditedPermission({
    permission: PERMISSION.CONFIGURATION_WRITE,
    deniedAudit: {
      action: SENSOR_THRESHOLD_AUDIT_ACTION,
      source: SENSOR_THRESHOLD_AUDIT_SOURCE,
      target: (req) => {
        const parsed = sensorThresholdParamsSchema.safeParse(req.params);
        return parsed.success ? { type: "SENSOR", id: parsed.data.sensorUuid } : undefined;
      },
    },
  }),
  validateParams(sensorThresholdParamsSchema),
  validateBody(updateSensorThresholdsSchema),
  sensorController.updateSensorThresholds
);

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
