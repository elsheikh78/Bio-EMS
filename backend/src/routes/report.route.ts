import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  exportReport,
  getReportCatalogue,
  previewReport,
} from "../controllers/report.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody } from "../middleware/validate-request";
import { reportPreviewSchema } from "../modules/reporting/dto/report-preview.schema";
import { reportExportSchema } from "../modules/reporting/dto/report-export.schema";

const router = Router();

router.get(
  "/catalogue",
  requirePermission(PERMISSION.REPORT_READ),
  getReportCatalogue,
);

router.post(
  "/preview",
  requirePermission(PERMISSION.REPORT_READ),
  validateBody(reportPreviewSchema),
  previewReport,
);

router.post(
  "/exports",
  requirePermission(PERMISSION.REPORT_EXPORT),
  validateBody(reportExportSchema),
  exportReport,
);

export default router;