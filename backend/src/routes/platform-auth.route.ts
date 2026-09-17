import { Router } from "express";
import {
  beginOwnerMfaEnrollmentController,
  confirmOwnerMfaEnrollmentController,
  currentPlatformPrincipalController,
  issueOwnerSupportGrantController,
  listOwnerSupportGrantsController,
  platformLoginController,
  platformLogoutController,
  revokeAllPlatformSessionsController,
  revokeOwnerSupportGrantController,
} from "../controllers/platform-auth.controller";
import {
  ownerMfaEnrollmentAuthenticationMiddleware,
  platformAuthenticationMiddleware,
} from "../middleware/platform-authentication.middleware";
import { platformLoginRateLimitMiddleware } from "../middleware/platform-login-rate-limit.middleware";
import { validateBody, validateParams } from "../middleware/validate-request";
import { platformLoginSchema } from "../modules/platform-auth/dto/platform-login.schema";
import { confirmOwnerMfaSchema } from "../modules/platform-auth/dto/owner-mfa.schema";
import {
  issueOwnerSupportGrantSchema,
  ownerSupportGrantParamsSchema,
  revokeOwnerSupportGrantSchema,
} from "../modules/platform-auth/dto/owner-support-grant.schema";

const router = Router();

router.post(
  "/login",
  platformLoginRateLimitMiddleware,
  validateBody(platformLoginSchema),
  platformLoginController
);
router.get("/me", platformAuthenticationMiddleware, currentPlatformPrincipalController);
router.post("/logout", platformAuthenticationMiddleware, platformLogoutController);
router.post(
  "/mfa/enrollment",
  ownerMfaEnrollmentAuthenticationMiddleware,
  beginOwnerMfaEnrollmentController
);
router.post(
  "/mfa/enrollment/confirm",
  ownerMfaEnrollmentAuthenticationMiddleware,
  validateBody(confirmOwnerMfaSchema),
  confirmOwnerMfaEnrollmentController
);
router.get("/support-grants", platformAuthenticationMiddleware, listOwnerSupportGrantsController);
router.post(
  "/support-grants",
  platformAuthenticationMiddleware,
  validateBody(issueOwnerSupportGrantSchema),
  issueOwnerSupportGrantController
);
router.post(
  "/support-grants/:grantId/revoke",
  platformAuthenticationMiddleware,
  validateParams(ownerSupportGrantParamsSchema),
  validateBody(revokeOwnerSupportGrantSchema),
  revokeOwnerSupportGrantController
);
router.post(
  "/sessions/revoke-all",
  platformAuthenticationMiddleware,
  revokeAllPlatformSessionsController
);

export default router;
