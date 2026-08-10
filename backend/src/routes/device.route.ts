import { Router } from "express";
import {
  activateDeviceController,
  createDeviceController,
  disableDeviceController,
  getDeviceController,
  getDevicesController,
  updateDeviceController,
} from "../controllers/device.controller";
import { validateBody, validateParams } from "../middleware/validate-request";
import {
  createDeviceSchema,
  deviceParamsSchema,
  updateDeviceSchema,
} from "../modules/device/dto/device.schema";

const router = Router();

router.post("/", validateBody(createDeviceSchema), createDeviceController);

router.get("/", getDevicesController);

router.post("/:deviceId/activate", validateParams(deviceParamsSchema), activateDeviceController);

router.post("/:deviceId/disable", validateParams(deviceParamsSchema), disableDeviceController);

router.get("/:deviceId", validateParams(deviceParamsSchema), getDeviceController);

router.patch(
  "/:deviceId",
  validateParams(deviceParamsSchema),
  validateBody(updateDeviceSchema),
  updateDeviceController
);

export default router;
