import { RequestHandler } from "express";
import { PERMISSION } from "../authorization/permissions";
import { UserAuditAction } from "../modules/user/user-audit";
import { requireAuditedPermission } from "./audited-authorization.middleware";

export function requireUserManagementPermission(action?: UserAuditAction): RequestHandler {
  return requireAuditedPermission({
    permission: PERMISSION.USER_MANAGE,
    deniedAudit: action
      ? {
          action,
          source: "USER_MANAGEMENT_API",
          target: (req) => safeUserTarget(req.params.user_id),
        }
      : undefined,
  });
}

function safeUserTarget(value: string | string[] | undefined) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value)
    ? { type: "USER" as const, id: value }
    : undefined;
}
