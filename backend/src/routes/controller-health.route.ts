import { Router } from "express";
import { z } from "zod";
import { sqlite } from "../../database/sqlite/client";
import { requirePermission } from "../middleware/authorization.middleware";
import { PERMISSION } from "../authorization/permissions";
import { auditEventService } from "../services/audit-event.service";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";
const router = Router();
router.get("/", requirePermission(PERMISSION.ALARM_READ), (_req, res) => {
  res.json(
    sqlite
      .prepare(
        `SELECT a.*,b.device_identity AS device,b.site_code AS site
    FROM controller_health_alarms a JOIN device_platform_bindings b ON b.platform_binding_id=a.binding_id
    ORDER BY CASE status WHEN 'TRIGGERED' THEN 0 WHEN 'ACKNOWLEDGED' THEN 1 ELSE 2 END,a.id DESC LIMIT 100`
      )
      .all()
  );
});
router.post("/:id/acknowledge", requirePermission(PERMISSION.ALARM_ACKNOWLEDGE), (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  sqlite.transaction(() => {
    const result = sqlite
      .prepare(
        `UPDATE controller_health_alarms SET status='ACKNOWLEDGED',acknowledged_at=?,acknowledged_by=?
      WHERE id=? AND status='TRIGGERED'`
      )
      .run(new Date().toISOString(), String(req.user!.id), id);
    if (result.changes)
      auditEventService.record({
        actor: customerAuditActor(req),
        action: "CONTROLLER_HEALTH.ACKNOWLEDGED",
        target: { type: "CONTROLLER_HEALTH_ALARM", id: String(id) },
        result: "SUCCESS",
        requestContext: customerRequestContext("CONTROLLER_HEALTH_API"),
      });
  })();
  res.json({ acknowledged: true });
});
export default router;
