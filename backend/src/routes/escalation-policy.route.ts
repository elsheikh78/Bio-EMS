import { Router } from "express";
import { PERMISSION } from "../authorization/permissions";
import * as controller from "../controllers/escalation-policy.controller";
import { requireAuditedPermission } from "../middleware/audited-authorization.middleware";
import { requirePermission } from "../middleware/authorization.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate-request";
import {
  createEscalationPolicySchema,
  escalationPolicyListQuerySchema,
  escalationPolicyParamsSchema,
  updateEscalationPolicySchema,
  updateEscalationPolicyStatusSchema,
} from "../modules/notification/dto/escalation-policy.schema";
import {
  ESCALATION_POLICY_AUDIT_ACTION,
  ESCALATION_POLICY_AUDIT_SOURCE,
} from "../modules/notification/escalation-policy-audit";

const router = Router();
const manage = (action: string) =>
  requireAuditedPermission({
    permission: PERMISSION.ESCALATION_POLICY_MANAGE,
    deniedAudit: {
      action,
      source: ESCALATION_POLICY_AUDIT_SOURCE,
      target: (req) => {
        const parsed = escalationPolicyParamsSchema.safeParse(req.params);
        return parsed.success
          ? { type: "ESCALATION_POLICY", id: parsed.data.policyUuid }
          : undefined;
      },
    },
  });
router.get(
  "/",
  requirePermission(PERMISSION.ESCALATION_POLICY_READ),
  validateQuery(escalationPolicyListQuerySchema),
  controller.listEscalationPolicies
);
router.post(
  "/",
  manage(ESCALATION_POLICY_AUDIT_ACTION.CREATED),
  validateBody(createEscalationPolicySchema),
  controller.createEscalationPolicy
);
router.patch(
  "/:policyUuid",
  manage(ESCALATION_POLICY_AUDIT_ACTION.UPDATED),
  validateParams(escalationPolicyParamsSchema),
  validateBody(updateEscalationPolicySchema),
  controller.updateEscalationPolicy
);
router.patch(
  "/:policyUuid/status",
  manage(ESCALATION_POLICY_AUDIT_ACTION.STATUS_UPDATED),
  validateParams(escalationPolicyParamsSchema),
  validateBody(updateEscalationPolicyStatusSchema),
  controller.updateEscalationPolicyStatus
);
export default router;
