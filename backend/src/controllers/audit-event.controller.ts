import { Request, Response } from "express";
import {
  customerAuditEventQuerySchema,
  platformAuditEventQuerySchema,
} from "../modules/audit/dto/audit-event-query.schema";
import { AuditEventRepository } from "../repositories/audit-event.repository";
import { AuditEventService } from "../services/audit-event.service";

const service = new AuditEventService({ repository: new AuditEventRepository() });

export function listCustomerAuditEvents(req: Request, res: Response): void {
  const query = customerAuditEventQuerySchema.parse(req.query);
  res.status(200).json({ events: service.listForCustomerSite(query.site_id, query.limit) });
}

export function listPlatformAuditEvents(req: Request, res: Response): void {
  const query = platformAuditEventQuerySchema.parse(req.query);
  res.status(200).json({ events: service.listForPlatform(query.site_id, query.limit) });
}
