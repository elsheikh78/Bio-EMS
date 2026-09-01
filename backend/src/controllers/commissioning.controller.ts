import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { customerAuditActor } from "../modules/audit/customer-audit-context";
import { CommissioningService } from "../modules/commissioning/commissioning.service";
import {
  renderCommissioningCsv,
  renderCommissioningPdf,
} from "../modules/commissioning/commissioning-export.renderer";

const service = new CommissioningService();

function siteId(req: Request): number {
  return Number(req.params.siteId);
}

function sessionId(req: Request): number {
  return Number(req.params.sessionId);
}

function actorIdentity(req: Request): string {
  const actor = customerAuditActor(req);
  return `${actor.username}#${actor.id}`;
}

export const createCommissioningSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = service.createSession({
      ...req.body,
      siteId: siteId(req),
      engineerIdentity: actorIdentity(req),
    });
    res.status(201).json({ success: true, id });
  }
);

export const addCommissioningCheckController = asyncHandler(async (req: Request, res: Response) => {
  const id = service.addCheck(siteId(req), {
    ...req.body,
    sessionId: sessionId(req),
  });
  res.status(201).json({ success: true, id });
});

export const appendCommissioningEvidenceController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = service.appendEvidence(siteId(req), {
      ...req.body,
      sessionId: sessionId(req),
      actorIdentity: actorIdentity(req),
    });
    res.status(201).json({ success: true, id });
  }
);

export const appendCommissioningDeviationController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = service.appendDeviation(siteId(req), sessionId(req), {
      ...req.body,
      actorIdentity: actorIdentity(req),
    });
    res.status(201).json({ success: true, id });
  }
);

export const appendCommissioningDecisionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = service.appendDecision({
      ...req.body,
      siteId: siteId(req),
      sessionId: sessionId(req),
      actorIdentity: actorIdentity(req),
    });
    res.status(201).json({ success: true, id });
  }
);

export const getCommissioningDeviationsController = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(service.listDeviations(siteId(req), sessionId(req)));
  }
);

export const getCommissioningConfigurationReadinessController = asyncHandler(
  async (req: Request, res: Response) => {
    const asOf = typeof req.query.asOf === "string" ? req.query.asOf : new Date().toISOString();
    res.json(service.getConfigurationReadiness(siteId(req), asOf));
  }
);

export const initializeCommissioningChecksController = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(201).json(service.initializeFunctionalChecks(siteId(req), sessionId(req)));
  }
);

export const getCommissioningSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(service.getSessionRecord(siteId(req), sessionId(req)));
  }
);

export const exportCommissioningSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const record = service.getSessionRecord(siteId(req), sessionId(req));
    const uuid = (record.session as { uuid: string }).uuid.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (req.query.format === "pdf") {
      res
        .type("application/pdf")
        .attachment(`bio-ems_commissioning_${uuid}.pdf`)
        .send(await renderCommissioningPdf(record));
      return;
    }
    res
      .type("text/csv")
      .attachment(`bio-ems_commissioning_${uuid}.csv`)
      .send(renderCommissioningCsv(record));
  }
);
