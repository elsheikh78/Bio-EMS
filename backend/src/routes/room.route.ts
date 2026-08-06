import { Router } from "express";
import * as roomController from "../controllers/room.controller";

const router = Router();

router.post("/", roomController.createRoom);

router.get("/", roomController.getRooms);

export default router;
