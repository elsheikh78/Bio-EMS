import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as alarmService from "../services/alarm.service";
import { auditEventService } from "../services/audit-event.service";
import { SensorRepository } from "../repositories/sensor.repository";
import { RoomRepository } from "../repositories/room.repository";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";

const sensorRepository = new SensorRepository();
const roomRepository = new RoomRepository();
const ALARM_AUDIT_SOURCE = "ALARM_MANAGEMENT_API";

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

  const alarm = alarmService.acknowledgeAlarm(id, req.user!.id);
  const sensor = alarm
    ? sensorRepository.getAll().find((candidate) => candidate.id === alarm.sensor_id)
    : undefined;
  const room = sensor ? roomRepository.findById(sensor.room_id) : undefined;

  if (alarm && sensor && room) {
    auditEventService.record({
      actor: customerAuditActor(req),
      action: "ALARM.ACKNOWLEDGED",
      target: { type: "ALARM", id: String(alarm.id) },
      siteId: room.site_id,
      result: "SUCCESS",
      previousValues: { status: "TRIGGERED" },
      newValues: {
        status: "ACKNOWLEDGED",
        sensor_id: alarm.sensor_id,
        alarm_type: alarm.type,
        severity: alarm.severity,
      },
      requestContext: customerRequestContext(ALARM_AUDIT_SOURCE),
    });
  }

  res.json({
    success: true,
  });
});
