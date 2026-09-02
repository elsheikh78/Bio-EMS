import { Router } from "express";
import {
  createPlatformCustomer,
  createPlatformLicense,
  createPlatformMaintenance,
  platformOperationsOverview,
  updatePlatformLicense,
  updatePlatformMaintenance,
} from "../controllers/platform-operations.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  createPlatformCustomerSchema,
  createPlatformLicenseSchema,
  createPlatformMaintenanceSchema,
  platformRecordParamsSchema,
  updatePlatformLicenseSchema,
  updatePlatformMaintenanceSchema,
} from "../modules/platform-operations/platform-operations.schema";

const router = Router();
router.use(platformAuthenticationMiddleware);
router.get("/", platformOperationsOverview);
router.post("/customers", validateBody(createPlatformCustomerSchema), createPlatformCustomer);
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
