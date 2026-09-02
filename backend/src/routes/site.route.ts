import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import { createSiteController, getSitesController } from "../controllers/site.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.post("/", requirePermission(PERMISSION.TOPOLOGY_MANAGE), createSiteController);

router.get("/", requirePermission(PERMISSION.CONFIGURATION_READ), getSitesController);

export default router;
