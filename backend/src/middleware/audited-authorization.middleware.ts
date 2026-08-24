import { NextFunction, Request, RequestHandler, Response } from "express";
import { hasPermission } from "../authorization/authorization.policy";
import { Permission } from "../authorization/permissions";
import { AppError } from "../errors/app-error";
import { AuditTarget } from "../entities/AuditEvent";
import {
  customerAuditActor,
  customerRequestContext,
} from "../modules/audit/customer-audit-context";
import { auditEventService } from "../services/audit-event.service";

export interface DeniedAuditOptions {
  action: string;
  source: string;
  target?: (req: Request) => AuditTarget | undefined;
}

export interface AuditedPermissionOptions {
  permission: Permission;
  deniedAudit?: DeniedAuditOptions;
}

const authenticationRequired = () =>
  new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
const forbidden = () => new AppError("Forbidden", 403, "FORBIDDEN");

export function requireAuditedPermission(options: AuditedPermissionOptions): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(authenticationRequired());
      return;
    }

    if (!hasPermission(req.user.role, options.permission)) {
      if (options.deniedAudit) {
        try {
          auditEventService.record({
            actor: customerAuditActor(req),
            action: options.deniedAudit.action,
            target: options.deniedAudit.target?.(req),
            result: "DENIED",
            requestContext: customerRequestContext(options.deniedAudit.source),
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
