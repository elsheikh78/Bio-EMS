import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as alarmService from "../services/alarm.service";

export const getAlarms = asyncHandler(async (_req: Request, res: Response) => {
  const alarms = alarmService.getAlarms();

  res.json(alarms);
});

export const getActiveAlarms = asyncHandler(async (_req: Request, res: Response) => {
  const alarms = alarmService.getActiveAlarms();

  res.json(alarms);
});

export const getAlarmById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const alarm = alarmService.getAlarmById(id);

  res.json(alarm);
});

export const acknowledgeAlarm = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  alarmService.acknowledgeAlarm(id);

  res.json({
    success: true,
  });
});
