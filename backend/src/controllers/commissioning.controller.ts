import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { CommissioningRepository } from "../modules/commissioning/commissioning.repository";

const repository = new CommissioningRepository();

function siteId(req: Request): number {
  return Number(req.params.siteId);
}

function sessionId(req: Request): number {
  return Number(req.params.sessionId);
}

export const createCommissioningSessionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = repository.createSession({ ...req.body, siteId: siteId(req) });
    res.status(201).json({ success: true, id });
  }
);

export const addCommissioningCheckController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = repository.addCheck({ ...req.body, sessionId: sessionId(req) });
    res.status(201).json({ success: true, id });
  }
);

export const appendCommissioningEvidenceController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = repository.appendEvidence({ ...req.body, sessionId: sessionId(req) });
    res.status(201).json({ success: true, id });
  }
);

export const appendCommissioningDeviationController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = repository.appendDeviation(sessionId(req), req.body);
    res.status(201).json({ success: true, id });
  }
);

export const appendCommissioningDecisionController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = repository.appendDecision({ ...req.body, sessionId: sessionId(req) });
    res.status(201).json({ success: true, id });
  }
);

export const getCommissioningDeviationsController = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(repository.listDeviations(sessionId(req)));
  }
);
