import { Router } from "express";
import {
  currentPlatformPrincipalController,
  platformLoginController,
  platformLogoutController,
  revokeAllPlatformSessionsController,
} from "../controllers/platform-auth.controller";
import { platformAuthenticationMiddleware } from "../middleware/platform-authentication.middleware";
import { validateBody } from "../middleware/validate-request";
import { platformLoginSchema } from "../modules/platform-auth/dto/platform-login.schema";

const router = Router();

router.post("/login", validateBody(platformLoginSchema), platformLoginController);
router.get("/me", platformAuthenticationMiddleware, currentPlatformPrincipalController);
router.post("/logout", platformAuthenticationMiddleware, platformLogoutController);
router.post(
  "/sessions/revoke-all",
  platformAuthenticationMiddleware,
  revokeAllPlatformSessionsController
);

export default router;
