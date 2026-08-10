import { Router } from "express";
import { createDeviceController, getDevicesController } from "../controllers/device.controller";
import { validateBody } from "../middleware/validate-request";
import { createDeviceSchema } from "../modules/device/dto/device.schema";

const router = Router();

router.post("/", validateBody(createDeviceSchema), createDeviceController);

router.get("/", getDevicesController);

export default router;
