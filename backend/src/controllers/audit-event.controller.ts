import { Request, Response } from "express";
import {
  customerAuditEventQuerySchema,
  platformAuditEventQuerySchema,
} from "../modules/audit/dto/audit-event-query.schema";
import { auditEventService } from "../services/audit-event.service";

export function listCustomerAuditEvents(req: Request, res: Response): void {
  const query = customerAuditEventQuerySchema.parse(req.query);
  res.status(200).json({
    events: auditEventService.listForCustomerSite(query.site_id, query.limit),
  });
}

export function listPlatformAuditEvents(req: Request, res: Response): void {
  const query = platformAuditEventQuerySchema.parse(req.query);
  res.status(200).json({
    events: auditEventService.listForPlatform(query.site_id, query.limit),
  });
}
