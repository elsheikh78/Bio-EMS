import { Router } from "express";
import { customerLoginRateLimitMiddleware } from "../middleware/customer-login-rate-limit.middleware";
import {
  changePasswordController,
  currentUserController,
  forgotPasswordController,
  loginController,
} from "../controllers/auth.controller";
import { passwordRecoveryRateLimitMiddleware } from "../middleware/password-recovery-rate-limit.middleware";
import { validateBody } from "../middleware/validate-request";
import { loginSchema } from "../modules/auth/dto/login.schema";
import {
  changePasswordSchema,
  forgotPasswordSchema,
} from "../modules/auth/dto/password-recovery.schema";

import {
  createAdminRecoveryRequest,
  authorizeAdminRecovery,
  completeAdminRecovery,
  adminRecoveryRequestInput,
  adminRecoveryCompleteInput,
} from "../controllers/admin-recovery.controller";
import { adminRecoveryPackageSchema } from "../modules/admin-recovery/admin-recovery.domain";

const router = Router();
router.post(
  "/admin-recovery/request",
  passwordRecoveryRateLimitMiddleware,
  validateBody(adminRecoveryRequestInput),
  createAdminRecoveryRequest
);
router.post(
  "/admin-recovery/authorize",
  passwordRecoveryRateLimitMiddleware,
  validateBody(adminRecoveryPackageSchema),
  authorizeAdminRecovery
);
router.post(
  "/admin-recovery/complete",
  passwordRecoveryRateLimitMiddleware,
  validateBody(adminRecoveryCompleteInput),
  completeAdminRecovery
);

router.post("/login", customerLoginRateLimitMiddleware, validateBody(loginSchema), loginController);
router.post(
  "/forgot-password",
  passwordRecoveryRateLimitMiddleware,
  validateBody(forgotPasswordSchema),
  forgotPasswordController
);
router.post("/change-password", validateBody(changePasswordSchema), changePasswordController);
router.get("/me", currentUserController);

export default router;
