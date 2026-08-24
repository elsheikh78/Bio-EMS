import { NextFunction, Request, RequestHandler, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { PlatformPrincipalRecord } from "../entities/PlatformPrincipal";
import { PlatformPrincipalRepository } from "../repositories/platform-principal.repository";
import { PlatformTokenService } from "../services/platform-token.service";
import { parseAuthorizationHeader } from "./authentication.middleware";

export interface PlatformAccessTokenVerifier {
  verifyAccessToken(token: string): {
    principalId: string;
    principalType: "SYSTEM_OWNER";
  };
}

export interface PlatformAuthenticationRepository {
  findById(id: string): PlatformPrincipalRecord | undefined;
}

const authenticationRequired = () =>
  new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED");

export function createPlatformAuthenticationMiddleware(
  tokenVerifier: PlatformAccessTokenVerifier | undefined,
  repository: PlatformAuthenticationRepository
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = parseAuthorizationHeader(req.headers.authorization);
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
      verified.principalType !== "SYSTEM_OWNER"
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
  new PlatformPrincipalRepository()
);
