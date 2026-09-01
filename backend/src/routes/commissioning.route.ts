import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  addCommissioningCheckController,
  appendCommissioningDecisionController,
  appendCommissioningDeviationController,
  appendCommissioningEvidenceController,
  createCommissioningSessionController,
  getCommissioningDeviationsController,
  getCommissioningConfigurationReadinessController,
  getCommissioningSessionController,
  initializeCommissioningChecksController,
  exportCommissioningSessionController,
} from "../controllers/commissioning.controller";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  appendCommissioningDecisionSchema,
  appendCommissioningDeviationSchema,
  appendCommissioningEvidenceSchema,
  commissioningSessionParamsSchema,
  commissioningSiteParamsSchema,
  commissioningReadinessQuerySchema,
  commissioningExportQuerySchema,
  createCommissioningCheckSchema,
  createCommissioningSessionSchema,
} from "../modules/commissioning/commissioning.schema";

const router = Router();

router.get(
  "/sites/:siteId/commissioning-readiness",
  requirePermission(PERMISSION.COMMISSIONING_READ),
  validateParams(commissioningSiteParamsSchema),
  validateQuery(commissioningReadinessQuerySchema),
  getCommissioningConfigurationReadinessController
);

router.get(
  "/sites/:siteId/commissioning-sessions/:sessionId",
  requirePermission(PERMISSION.COMMISSIONING_READ),
  validateParams(commissioningSessionParamsSchema),
  getCommissioningSessionController
);

router.post(
  "/sites/:siteId/commissioning-sessions/:sessionId/initialize-checks",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSessionParamsSchema),
  initializeCommissioningChecksController
);

router.get(
  "/sites/:siteId/commissioning-sessions/:sessionId/export",
  requirePermission(PERMISSION.COMMISSIONING_READ),
  validateParams(commissioningSessionParamsSchema),
  validateQuery(commissioningExportQuerySchema),
  exportCommissioningSessionController
);

router.post(
  "/sites/:siteId/commissioning-sessions",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSiteParamsSchema),
  validateBody(createCommissioningSessionSchema),
  createCommissioningSessionController
);

router.post(
  "/sites/:siteId/commissioning-sessions/:sessionId/checks",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSessionParamsSchema),
  validateBody(createCommissioningCheckSchema),
  addCommissioningCheckController
);

router.post(
  "/sites/:siteId/commissioning-sessions/:sessionId/evidence",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSessionParamsSchema),
  validateBody(appendCommissioningEvidenceSchema),
  appendCommissioningEvidenceController
);

router.post(
  "/sites/:siteId/commissioning-sessions/:sessionId/deviations",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSessionParamsSchema),
  validateBody(appendCommissioningDeviationSchema),
  appendCommissioningDeviationController
);

router.get(
  "/sites/:siteId/commissioning-sessions/:sessionId/deviations",
  requirePermission(PERMISSION.COMMISSIONING_READ),
  validateParams(commissioningSessionParamsSchema),
  getCommissioningDeviationsController
);

router.post(
  "/sites/:siteId/commissioning-sessions/:sessionId/decisions",
  requirePermission(PERMISSION.COMMISSIONING_MANAGE),
  validateParams(commissioningSessionParamsSchema),
  validateBody(appendCommissioningDecisionSchema),
  appendCommissioningDecisionController
);

export default router;
