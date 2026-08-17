import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as calibrationService from "../services/calibration.service";
import * as sensorService from "../services/sensor.service";

export const createSensor = asyncHandler(async (req: Request, res: Response) => {
  const id = sensorService.createSensor(req.body);

  res.status(201).json({
    id,
  });
});

export const getSensors = asyncHandler(async (_req: Request, res: Response) => {
  const sensors = sensorService.getSensors();

  res.json(sensors);
});

export const createCalibrationRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = calibrationService.createCalibrationRecord(
    req.params.sensorUuid as string,
    req.body,
    req.user!.id
  );

  res.status(201).json(record);
});

export const getCalibrationHistory = asyncHandler(async (req: Request, res: Response) => {
  res.json(calibrationService.getCalibrationHistory(req.params.sensorUuid as string));
});
