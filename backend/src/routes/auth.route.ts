import { Router } from "express";
import { currentUserController, loginController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate-request";
import { loginSchema } from "../modules/auth/dto/login.schema";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.get("/me", currentUserController);

export default router;
