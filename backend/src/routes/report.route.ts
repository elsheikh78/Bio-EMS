import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { getReportCatalogue } from "../controllers/report.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.get("/catalogue", requirePermission(PERMISSION.REPORT_READ), getReportCatalogue);

export default router;
