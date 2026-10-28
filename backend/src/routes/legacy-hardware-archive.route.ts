import { Router } from "express";
import { getHardwareTestRun, listHardwareTestRuns } from "../controllers/hardware-lab.controller";
import { validateParams } from "../middleware/validate-request";
import { hardwareTestRunParamsSchema } from "../modules/hardware-lab/hardware-lab.schema";

// Mounted AFTER platform authentication. No new run, result, firmware or event writes.
export const legacyHardwareArchiveRouter = Router();
legacyHardwareArchiveRouter.get("/runs", listHardwareTestRuns);
legacyHardwareArchiveRouter.get(
  "/runs/:runId",
  validateParams(hardwareTestRunParamsSchema),
  getHardwareTestRun
);
legacyHardwareArchiveRouter.use((_req, res) => {
  res.status(410).json({
    code: "HARDWARE_LAB_MOVED_TO_STANDALONE_TESTER",
    message:
      "Hardware qualification is now performed in BIO-EMS Hardware Tester. Historical runs remain read-only.",
  });
});
