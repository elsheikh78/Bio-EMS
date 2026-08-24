import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";
import * as calibrationService from "../services/calibration.service";
import * as sensorService from "../services/sensor.service";
import { sensorThresholdService } from "../services/sensor-threshold.service";

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

export const updateSensorThresholds = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    sensorThresholdService.updateThresholds(
      customerAuditActor(req),
      req.params.sensorUuid as string,
      req.body,
      customerRequestContext("SENSOR_CONFIGURATION_API")
    )
  );
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
