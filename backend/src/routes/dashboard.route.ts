import { Router } from "express";

import { PERMISSION } from "../authorization/permissions";
import { DashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../middleware/async-handler";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

const dashboardController = new DashboardController();

router.get(
  "/summary",
  requirePermission(PERMISSION.DASHBOARD_READ),
  asyncHandler(dashboardController.getSummary.bind(dashboardController))
);

router.get(
  "/latest-telemetry",
  requirePermission(PERMISSION.DASHBOARD_READ),
  asyncHandler(dashboardController.getLatestTelemetry.bind(dashboardController))
);

router.get(
  "/rooms/status",
  requirePermission(PERMISSION.DASHBOARD_READ),
  asyncHandler(dashboardController.getRoomStatus.bind(dashboardController))
);

router.get(
  "/alarm-statistics",
  requirePermission(PERMISSION.DASHBOARD_READ),
  asyncHandler(dashboardController.getAlarmStatistics.bind(dashboardController))
);

export default router;
