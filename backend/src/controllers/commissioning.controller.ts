import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { customerAuditActor } from "../modules/audit/customer-audit-context";
import { CommissioningService } from "../modules/commissioning/commissioning.service";

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
