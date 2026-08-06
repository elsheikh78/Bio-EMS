import { Router } from "express";

import { DashboardController } from "../controllers/dashboard.controller";
import { asyncHandler } from "../middleware/async-handler";

const router = Router();

const dashboardController = new DashboardController();

router.get("/summary", asyncHandler(dashboardController.getSummary.bind(dashboardController)));

router.get(
  "/latest-telemetry",
  asyncHandler(dashboardController.getLatestTelemetry.bind(dashboardController))
);

router.get(
  "/rooms/status",
  asyncHandler(dashboardController.getRoomStatus.bind(dashboardController))
);

router.get(
  "/alarm-statistics",
  asyncHandler(dashboardController.getAlarmStatistics.bind(dashboardController))
);

export default router;
