import { sqlite } from "../../database/sqlite/client";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { PlatformPrincipalRecord } from "../entities/PlatformPrincipal";
import { PlatformPrincipalRepository } from "../repositories/platform-principal.repository";
import { PlatformSessionService } from "../services/platform-session.service";
import { PlatformTokenService } from "../services/platform-token.service";
import { parseSingleAuthorizationHeader } from "./authentication.middleware";

export interface PlatformAccessTokenVerifier {
  verifyAccessToken(token: string): {
    principalId: string;
    principalType: "SYSTEM_OWNER";
    sessionId?: string;
  };
}

export interface PlatformAuthenticationRepository {
  findById(id: string): PlatformPrincipalRecord | undefined;
}

export interface PlatformSessionVerifier {
  isActive(sessionId: string, principalId: string, accessToken: string): boolean;
}

const authenticationRequired = () =>
  new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED");

export function createPlatformAuthenticationMiddleware(
  tokenVerifier: PlatformAccessTokenVerifier | undefined,
  repository: PlatformAuthenticationRepository,
  sessions?: PlatformSessionVerifier
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = parseSingleAuthorizationHeader(req);
    if (!tokenVerifier || !token) {
      next(authenticationRequired());
      return;
    }

    let verified: ReturnType<PlatformAccessTokenVerifier["verifyAccessToken"]>;
    try {
      verified = tokenVerifier.verifyAccessToken(token);
    } catch {
      next(authenticationRequired());
      return;
    }

    const record = repository.findById(verified.principalId);
    if (
      !record ||
      record.status !== "active" ||
      record.principal_type !== "SYSTEM_OWNER" ||
      verified.principalType !== "SYSTEM_OWNER" ||
      !verified.sessionId ||
      !sessions?.isActive(verified.sessionId, verified.principalId, token)
    ) {
      next(authenticationRequired());
      return;
    }

    req.platformPrincipal = {
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: record.id,
      username: record.username,
    };
    next();
  };
}

export const platformAuthenticationMiddleware = createPlatformAuthenticationMiddleware(
  config.platformJwt ? new PlatformTokenService(config.platformJwt) : undefined,
  new PlatformPrincipalRepository(),
  new PlatformSessionService(sqlite)
);
