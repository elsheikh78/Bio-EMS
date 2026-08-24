import { NextFunction, Request, RequestHandler, Response } from "express";
import { hasPermission } from "../authorization/authorization.policy";
import { PERMISSION } from "../authorization/permissions";
import { AppError } from "../errors/app-error";
import {
  customerAuditActor,
  UserAuditAction,
  userManagementRequestContext,
} from "../modules/user/user-audit";
import { auditEventService } from "../services/audit-event.service";

const authenticationRequired = () =>
  new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
const forbidden = () => new AppError("Forbidden", 403, "FORBIDDEN");

export function requireUserManagementPermission(action?: UserAuditAction): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(authenticationRequired());
      return;
    }

    if (!hasPermission(req.user.role, PERMISSION.USER_MANAGE)) {
      if (action) {
        try {
          auditEventService.record({
            actor: customerAuditActor(req),
            action,
            target: safeUserTarget(req.params.user_id),
            result: "DENIED",
            requestContext: userManagementRequestContext(),
            reason: "FORBIDDEN",
          });
        } catch {
          // Authorization remains fail-closed even if denial evidence cannot be persisted.
        }
      }
      next(forbidden());
      return;
    }

    next();
  };
}

function safeUserTarget(value: string | string[] | undefined) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value)
    ? { type: "USER" as const, id: value }
    : undefined;
}
