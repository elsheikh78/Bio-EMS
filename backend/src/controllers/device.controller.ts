import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import {
  activateDevice,
  createDevice,
  disableDevice,
  getDeviceByDeviceId,
  getDevices,
  updateDeviceMetadata,
} from "../services/device.service";
import { getDeviceHealth } from "../services/device-health.service";
import { auditEventService } from "../services/audit-event.service";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";

const DEVICE_AUDIT_SOURCE = "DEVICE_MANAGEMENT_API";

function recordDeviceChange(
  req: Request,
  action: string,
  after: ReturnType<typeof getDeviceByDeviceId>
) {
  auditEventService.record({
    actor: customerAuditActor(req),
    action,
    target: { type: "DEVICE", id: after.device_id },
    siteId: after.site_id,
    result: "SUCCESS",
    newValues: {
      status: after.status,
      activated: after.activated,
      device_type: after.device_type,
      protocol: after.protocol,
      manufacturer: after.manufacturer,
      model: after.model,
      firmware_version: after.firmware_version,
    },
    requestContext: customerRequestContext(DEVICE_AUDIT_SOURCE),
  });
}

export const createDeviceController = asyncHandler(async (req: Request, res: Response) => {
  const deviceId = createDevice(req.body);

  res.status(201).json({
    success: true,
    id: deviceId,
  });
});

export const getDevicesController = asyncHandler(async (req: Request, res: Response) => {
  res.json(getDevices());
});

export const getDeviceController = asyncHandler(async (req: Request, res: Response) => {
  res.json(getDeviceByDeviceId(req.params.deviceId as string));
});

export const updateDeviceController = asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.deviceId as string;
  const after = updateDeviceMetadata(deviceId, req.body);
  recordDeviceChange(req, "DEVICE.METADATA_UPDATED", after);
  res.json(after);
});

export const activateDeviceController = asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.deviceId as string;
  const after = activateDevice(deviceId);
  recordDeviceChange(req, "DEVICE.ACTIVATED_OR_REACTIVATED", after);
  res.json(after);
});

export const disableDeviceController = asyncHandler(async (req: Request, res: Response) => {
  const deviceId = req.params.deviceId as string;
  const after = disableDevice(deviceId);
  recordDeviceChange(req, "DEVICE.DISABLED", after);
  res.json(after);
});

export const getDeviceHealthController = asyncHandler(async (req: Request, res: Response) => {
  res.json(getDeviceHealth(req.params.deviceId as string));
});
