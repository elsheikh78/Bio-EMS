import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { getReportCatalogue, previewReport } from "../controllers/report.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody } from "../middleware/validate-request";
import { calibrationReportPreviewSchema } from "../modules/reporting/dto/calibration-report-preview.schema";

const router = Router();

router.get("/catalogue", requirePermission(PERMISSION.REPORT_READ), getReportCatalogue);
router.post(
  "/preview",
  requirePermission(PERMISSION.REPORT_READ),
  validateBody(calibrationReportPreviewSchema),
  previewReport
);

export default router;
