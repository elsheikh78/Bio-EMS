import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { createDevice, getDevices } from "../services/device.service";

export const createDeviceController = asyncHandler(async (req: Request, res: Response) => {

    const deviceId = createDevice(req.body);

    res.status(201).json({
        success: true,
        id: deviceId
    });

});

export const getDevicesController = asyncHandler(async (req: Request, res: Response) => {

    res.json(getDevices());

});