import { Router } from "express";
import { createDeviceController, getDevicesController } from "../controllers/device.controller";

const router = Router();

router.post("/", createDeviceController);

router.get("/", getDevicesController);

export default router;
