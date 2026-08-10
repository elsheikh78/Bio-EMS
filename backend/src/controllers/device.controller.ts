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
  res.json(updateDeviceMetadata(req.params.deviceId as string, req.body));
});

export const activateDeviceController = asyncHandler(async (req: Request, res: Response) => {
  res.json(activateDevice(req.params.deviceId as string));
});

export const disableDeviceController = asyncHandler(async (req: Request, res: Response) => {
  res.json(disableDevice(req.params.deviceId as string));
});
