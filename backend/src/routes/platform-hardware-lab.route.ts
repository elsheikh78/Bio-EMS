import { Router } from "express";
import {
  addHardwareEvent,
  addHardwareMeasurement,
  createHardwareRun,
  getHardwareLabProfile,
  getHardwareQualificationReport,
  getHardwareRun,
  listHardwareRuns,
  recordHardwareFirmware,
  recordHardwareStep,
} from "../controllers/hardware-lab.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  createHardwareRunSchema,
  hardwareEventSchema,
  hardwareFirmwareEvidenceSchema,
  hardwareFirmwareParamsSchema,
  hardwareMeasurementSchema,
  hardwareRunParamsSchema,
  hardwareStepEvidenceSchema,
  hardwareStepParamsSchema,
} from "../modules/hardware-lab/hardware-lab.schema";

const router = Router();

router.use(platformAuthenticationMiddleware);
router.get("/profile", getHardwareLabProfile);
router.get("/runs", listHardwareRuns);
router.post("/runs", validateBody(createHardwareRunSchema), createHardwareRun);
router.get("/runs/:runId", validateParams(hardwareRunParamsSchema), getHardwareRun);
router.get(
  "/runs/:runId/report",
  validateParams(hardwareRunParamsSchema),
  getHardwareQualificationReport
);
router.put(
  "/runs/:runId/steps/:stepKey",
  validateParams(hardwareStepParamsSchema),
  validateBody(hardwareStepEvidenceSchema),
  recordHardwareStep
);
router.post(
  "/runs/:runId/measurements",
  validateParams(hardwareRunParamsSchema),
  validateBody(hardwareMeasurementSchema),
  addHardwareMeasurement
);
router.post(
  "/runs/:runId/events",
  validateParams(hardwareRunParamsSchema),
  validateBody(hardwareEventSchema),
  addHardwareEvent
);
router.put(
  "/runs/:runId/firmware/:target",
  validateParams(hardwareFirmwareParamsSchema),
  validateBody(hardwareFirmwareEvidenceSchema),
  recordHardwareFirmware
);

export default router;
