import { Router } from "express";
import { platformLoginController } from "../controllers/platform-auth.controller";
import { validateBody } from "../middleware/validate-request";
import { platformLoginSchema } from "../modules/platform-auth/dto/platform-login.schema";

const router = Router();

router.post("/login", validateBody(platformLoginSchema), platformLoginController);

export default router;
