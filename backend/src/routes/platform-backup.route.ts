import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

/**
 * DEP-BR customer backup surface.
 *
 * The route is deliberately ADMIN-only at the authorization boundary. Backup
 * execution/list/restore handlers are added behind this boundary so OPERATOR
 * and VIEWER can never reach privileged platform-state operations.
 */
router.use(requirePermission(PERMISSION.PLATFORM_BACKUP_READ));

router.get("/", (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "PLATFORM_BACKUP_NOT_IMPLEMENTED",
      message: "Platform backup execution is not available yet",
    },
  });
});

export default router;
