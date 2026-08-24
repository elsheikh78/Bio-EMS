import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";
import { escalationPolicyService } from "../services/escalation-policy.service";

const context = () => customerRequestContext("ESCALATION_POLICY_API");
export const listEscalationPolicies = asyncHandler(async (req: Request, res: Response) =>
  res.json(escalationPolicyService.list(Number(req.query.site_id)))
);
export const createEscalationPolicy = asyncHandler(async (req: Request, res: Response) =>
  res.status(201).json(escalationPolicyService.create(customerAuditActor(req), req.body, context()))
);
export const updateEscalationPolicy = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    escalationPolicyService.update(
      customerAuditActor(req),
      req.params.policyUuid as string,
      req.body,
      context()
    )
  )
);
export const updateEscalationPolicyStatus = asyncHandler(async (req: Request, res: Response) =>
  res.json(
    escalationPolicyService.updateStatus(
      customerAuditActor(req),
      req.params.policyUuid as string,
      req.body,
      context()
    )
  )
);
