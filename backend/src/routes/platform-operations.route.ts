import { Router } from "express";
import {
  createPlatformCustomer,
  createPlatformLicense,
  createPlatformMaintenance,
  platformOperationsOverview,
  updatePlatformLicense,
  updatePlatformMaintenance,
  listPlatformCustomerAdmins,
  createPlatformCustomerAdmin,
  updatePlatformCustomerAdminStatus,
  updatePlatformCustomerAdminPassword,
} from "../controllers/platform-operations.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  createPlatformCustomerSchema,
  createPlatformLicenseSchema,
  createPlatformMaintenanceSchema,
  platformRecordParamsSchema,
  updatePlatformLicenseSchema,
  updatePlatformMaintenanceSchema,
  platformCustomerParamsSchema,
  platformCustomerAdminParamsSchema,
  createPlatformCustomerAdminSchema,
  updatePlatformCustomerAdminStatusSchema,
  updatePlatformCustomerAdminPasswordSchema,
} from "../modules/platform-operations/platform-operations.schema";
import {
  createInstallation,
  getPlatformInstallation,
  listInstallations,
  queueInstallation,
  receiveInstallation,
  reviseInstallation,
  sendInstallation,
  technicalInstallationDecision,
  validateInstallation,
} from "../controllers/installation.controller";
import {
  createInstallationSchema,
  installationDecisionSchema,
  installationListQuerySchema,
  installationParamsSchema,
  installationReceiptSchema,
  reviseInstallationSchema,
} from "../modules/installation/installation.schema";

const router = Router();
router.use(platformAuthenticationMiddleware);
router.get("/", platformOperationsOverview);
router.post("/customers", validateBody(createPlatformCustomerSchema), createPlatformCustomer);
router.get("/installations", validateQuery(installationListQuerySchema), listInstallations);
router.get(
  "/installations/:installationId",
  validateParams(installationParamsSchema),
  getPlatformInstallation
);
router.post(
  "/customers/:customerId/installations",
  validateParams(platformCustomerParamsSchema),
  validateBody(createInstallationSchema),
  createInstallation
);
router.put(
  "/installations/:installationId/draft",
  validateParams(installationParamsSchema),
  validateBody(reviseInstallationSchema),
  reviseInstallation
);
router.post(
  "/installations/:installationId/validate",
  validateParams(installationParamsSchema),
  validateInstallation
);
router.post(
  "/installations/:installationId/queue",
  validateParams(installationParamsSchema),
  queueInstallation
);
router.post(
  "/installations/:installationId/send",
  validateParams(installationParamsSchema),
  sendInstallation
);
router.post(
  "/installations/:installationId/device-receipt",
  validateParams(installationParamsSchema),
  validateBody(installationReceiptSchema),
  receiveInstallation
);
router.post(
  "/installations/:installationId/technical-decision",
  validateParams(installationParamsSchema),
  validateBody(installationDecisionSchema),
  technicalInstallationDecision
);
router.get(
  "/customers/:customerId/admins",
  validateParams(platformCustomerParamsSchema),
  listPlatformCustomerAdmins
);
router.post(
  "/customers/:customerId/admins",
  validateParams(platformCustomerParamsSchema),
  validateBody(createPlatformCustomerAdminSchema),
  createPlatformCustomerAdmin
);
router.patch(
  "/customers/:customerId/admins/:userId/status",
  validateParams(platformCustomerAdminParamsSchema),
  validateBody(updatePlatformCustomerAdminStatusSchema),
  updatePlatformCustomerAdminStatus
);
router.patch(
  "/customers/:customerId/admins/:userId/password",
  validateParams(platformCustomerAdminParamsSchema),
  validateBody(updatePlatformCustomerAdminPasswordSchema),
  updatePlatformCustomerAdminPassword
);
router.post("/licenses", validateBody(createPlatformLicenseSchema), createPlatformLicense);
router.patch(
  "/licenses/:id",
  validateParams(platformRecordParamsSchema),
  validateBody(updatePlatformLicenseSchema),
  updatePlatformLicense
);
router.post(
  "/service-events",
  validateBody(createPlatformMaintenanceSchema),
  createPlatformMaintenance
);
router.patch(
  "/service-events/:id",
  validateParams(platformRecordParamsSchema),
  validateBody(updatePlatformMaintenanceSchema),
  updatePlatformMaintenance
);
export default router;
