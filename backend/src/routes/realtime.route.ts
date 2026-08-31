import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { streamRealtimeEvents } from "../controllers/realtime.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.get("/events", requirePermission(PERMISSION.DASHBOARD_READ), streamRealtimeEvents);

export default router;
