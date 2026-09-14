import { sqlite } from "../../database/sqlite/client";
import { Request, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { PlatformPrincipalRepository } from "../repositories/platform-principal.repository";
import { PlatformAuthService } from "../services/platform-auth.service";
import { PlatformSessionService } from "../services/platform-session.service";
import { PlatformTokenService } from "../services/platform-token.service";

const unavailable = () =>
  new AppError("Platform authentication unavailable", 503, "PLATFORM_AUTH_UNAVAILABLE");

export const platformLoginController = asyncHandler(async (req: Request, res: Response) => {
  if (!config.platformJwt) {
    throw unavailable();
  }

  const service = new PlatformAuthService(
    new PlatformPrincipalRepository(),
    new PlatformTokenService(config.platformJwt),
    undefined,
    new PlatformSessionService(sqlite)
  );

  res.status(200).json(
    await service.login(req.body, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    })
  );
});

export const currentPlatformPrincipalController = (req: Request, res: Response): void => {
  res.status(200).json({ principal: req.platformPrincipal! });
};

export const platformLogoutController = (req: Request, res: Response): void => {
  const revoked = new PlatformSessionService(sqlite).revoke(
    req.platformSessionId!,
    req.platformPrincipal!.id
  );
  if (!revoked) {
    throw new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED");
  }
  res.status(204).send();
};

export const revokeAllPlatformSessionsController = (req: Request, res: Response): void => {
  const revoked = new PlatformSessionService(sqlite).revokeAll(req.platformPrincipal!.id);
  res.status(200).json({ revoked_sessions: revoked });
};
