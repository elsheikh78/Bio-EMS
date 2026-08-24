import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { listCustomerAuditEvents } from "../controllers/audit-event.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateQuery } from "../middleware/validate-request";
import { customerAuditEventQuerySchema } from "../modules/audit/dto/audit-event-query.schema";

const router = Router();

router.get(
  "/",
  requirePermission(PERMISSION.AUDIT_READ),
  validateQuery(customerAuditEventQuerySchema),
  listCustomerAuditEvents
);

export default router;
