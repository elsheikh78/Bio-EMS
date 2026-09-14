import { Router } from "express";
import {
  beginOwnerMfaEnrollmentController,
  confirmOwnerMfaEnrollmentController,
  currentPlatformPrincipalController,
  platformLoginController,
  platformLogoutController,
  revokeAllPlatformSessionsController,
} from "../controllers/platform-auth.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody } from "../middleware/validate-request";
import { platformLoginSchema } from "../modules/platform-auth/dto/platform-login.schema";
import { confirmOwnerMfaSchema } from "../modules/platform-auth/dto/owner-mfa.schema";

const router = Router();

router.post("/login", validateBody(platformLoginSchema), platformLoginController);
router.get("/me", platformAuthenticationMiddleware, currentPlatformPrincipalController);
router.post("/logout", platformAuthenticationMiddleware, platformLogoutController);
router.post("/mfa/enrollment", platformAuthenticationMiddleware, beginOwnerMfaEnrollmentController);
router.post(
  "/mfa/enrollment/confirm",
  platformAuthenticationMiddleware,
  validateBody(confirmOwnerMfaSchema),
  confirmOwnerMfaEnrollmentController
);
router.post(
  "/sessions/revoke-all",
  platformAuthenticationMiddleware,
  revokeAllPlatformSessionsController
);

export default router;
