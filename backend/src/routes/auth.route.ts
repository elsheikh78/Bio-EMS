import { Router } from "express";
import { loginController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate-request";
import { loginSchema } from "../modules/auth/dto/login.schema";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);

export default router;
