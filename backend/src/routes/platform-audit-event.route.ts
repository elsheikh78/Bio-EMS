import { Router } from "express";
import { listPlatformAuditEvents } from "../controllers/audit-event.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateQuery } from "../middleware/validate-request";
import { platformAuditEventQuerySchema } from "../modules/audit/dto/audit-event-query.schema";

const router = Router();

router.get(
  "/",
  platformAuthenticationMiddleware,
  validateQuery(platformAuditEventQuerySchema),
  listPlatformAuditEvents
);

export default router;
