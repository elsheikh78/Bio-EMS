import { Router } from "express";
import {
  createPlatformCustomer,
  createPlatformLicense,
  createPlatformMaintenance,
  platformOperationsOverview,
} from "../controllers/platform-operations.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody } from "../middleware/validate-request";
import {
  createPlatformCustomerSchema,
  createPlatformLicenseSchema,
  createPlatformMaintenanceSchema,
} from "../modules/platform-operations/platform-operations.schema";

const router = Router();
router.use(platformAuthenticationMiddleware);
router.get("/", platformOperationsOverview);
router.post("/customers", validateBody(createPlatformCustomerSchema), createPlatformCustomer);
router.post("/licenses", validateBody(createPlatformLicenseSchema), createPlatformLicense);
router.post(
  "/service-events",
  validateBody(createPlatformMaintenanceSchema),
  createPlatformMaintenance
);
export default router;
