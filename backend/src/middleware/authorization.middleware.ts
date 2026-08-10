import { NextFunction, Request, RequestHandler, Response } from "express";
import { hasPermission } from "../authorization/authorization.policy";
import { Permission } from "../authorization/permissions";
import { AppError } from "../errors/app-error";

const authenticationRequired = () =>
  new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

const forbidden = () => new AppError("Forbidden", 403, "FORBIDDEN");

export function requirePermission(permission: Permission): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(authenticationRequired());
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(forbidden());
      return;
    }

    next();
  };
}
