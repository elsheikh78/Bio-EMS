import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import {
  activateDeviceController,
  createDeviceController,
  disableDeviceController,
  getDeviceController,
  getDevicesController,
  updateDeviceController,
} from "../controllers/device.controller";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import { requirePermission } from "../middleware/authorization.middleware";
import {
  createDeviceSchema,
  deviceListQuerySchema,
  deviceParamsSchema,
  updateDeviceSchema,
} from "../modules/device/dto/device.schema";

const router = Router();

router.post(
  "/",
  requirePermission(PERMISSION.DEVICE_MANAGE),
  validateBody(createDeviceSchema),
  createDeviceController
);

router.get(
  "/",
  requirePermission(PERMISSION.DEVICE_READ),
  validateQuery(deviceListQuerySchema),
  getDevicesController
);

router.post(
  "/:deviceId/activate",
  requirePermission(PERMISSION.DEVICE_MANAGE),
  validateParams(deviceParamsSchema),
  activateDeviceController
);

router.post(
  "/:deviceId/disable",
  requirePermission(PERMISSION.DEVICE_MANAGE),
  validateParams(deviceParamsSchema),
  disableDeviceController
);

router.get(
  "/:deviceId",
  requirePermission(PERMISSION.DEVICE_READ),
  validateParams(deviceParamsSchema),
  getDeviceController
);

router.patch(
  "/:deviceId",
  requirePermission(PERMISSION.DEVICE_MANAGE),
  validateParams(deviceParamsSchema),
  validateBody(updateDeviceSchema),
  updateDeviceController
);

export default router;
