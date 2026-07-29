import { Request, Response } from "express";
import { createDevice, getDevices } from "../services/device.service";

export function createDeviceController(req: Request, res: Response) {

    const deviceId = createDevice(req.body);

    res.status(201).json({
        success: true,
        id: deviceId
    });

}

export function getDevicesController(req: Request, res: Response) {

    res.json(getDevices());

}