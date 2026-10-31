import { Router } from "express";
import { z } from "zod";
import { sqlite } from "../../database/sqlite/client";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { asyncHandler } from "../middleware/async-handler";
import { FeaturePolicyStore } from "../modules/controller-runtime/feature-policy";
import { AppError } from "../errors/app-error";

const router = Router();
router.use(platformAuthenticationMiddleware);
const store = new FeaturePolicyStore();
function scope(value: unknown) {
  const id = z.union([z.literal("platform"), z.uuid()]).parse(value);
  if (
    id !== "platform" &&
    !sqlite
      .prepare(
        "SELECT 1 FROM device_platform_bindings WHERE platform_binding_id=? AND status='ACTIVE'"
      )
      .get(id)
  )
    throw new AppError("Active controller not found", 404, "CONTROLLER_NOT_FOUND");
  return id;
}
router.get("/", (_req, res) => {
  const controllers = sqlite
    .prepare(
      `SELECT b.platform_binding_id AS id,b.device_identity AS name,b.site_code AS site,
    h.applied_revision AS appliedRevision,h.health_json AS healthJson,h.received_at AS receivedAt
    FROM device_platform_bindings b LEFT JOIN controller_health h ON h.binding_id=b.platform_binding_id
    WHERE b.status='ACTIVE'`
    )
    .all();
  const alarms = sqlite
    .prepare(
      `SELECT * FROM controller_health_alarms ORDER BY
    CASE status WHEN 'TRIGGERED' THEN 0 WHEN 'ACKNOWLEDGED' THEN 1 ELSE 2 END,id DESC LIMIT 100`
    )
    .all();
  res.json({ controllers, alarms });
});
router.get("/:scope", (req, res) => res.json(store.get(scope(req.params.scope))));
router.put(
  "/:scope",
  asyncHandler(async (req, res) => {
    res.json(store.save(scope(req.params.scope), req.body, req.platformPrincipal!.id));
  })
);
router.post("/alarms/:id/acknowledge", (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  sqlite
    .prepare(
      `UPDATE controller_health_alarms SET status='ACKNOWLEDGED',acknowledged_at=?,acknowledged_by=?
    WHERE id=? AND status='TRIGGERED'`
    )
    .run(new Date().toISOString(), req.platformPrincipal!.id, id);
  res.json({ acknowledged: true });
});
export default router;
