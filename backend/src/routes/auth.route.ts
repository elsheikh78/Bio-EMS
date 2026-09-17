import { Router } from "express";
import {
  changePasswordController,
  currentUserController,
  forgotPasswordController,
  loginController,
} from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate-request";
import { loginSchema } from "../modules/auth/dto/login.schema";
import {
  changePasswordSchema,
  forgotPasswordSchema,
} from "../modules/auth/dto/password-recovery.schema";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/change-password", validateBody(changePasswordSchema), changePasswordController);
router.get("/me", currentUserController);

export default router;
