import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as roomController from "../controllers/room.controller";
import { requirePermission } from "../middleware/authorization.middleware";

const router = Router();

router.post("/", requirePermission(PERMISSION.TOPOLOGY_MANAGE), roomController.createRoom);

router.get("/", requirePermission(PERMISSION.CONFIGURATION_READ), roomController.getRooms);

export default router;
