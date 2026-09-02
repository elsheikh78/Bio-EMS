import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  customerInstallationDecision,
  getCustomerInstallation,
} from "../controllers/installation.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  installationDecisionSchema,
  installationParamsSchema,
} from "../modules/installation/installation.schema";

const router = Router();
router.get(
  "/:installationId",
  requirePermission(PERMISSION.COMMISSIONING_READ),
  validateParams(installationParamsSchema),
  getCustomerInstallation
);
router.post(
  "/:installationId/acceptance",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(installationParamsSchema),
  validateBody(installationDecisionSchema),
  customerInstallationDecision
);
export default router;
