import { NextFunction, Request, RequestHandler, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { User } from "../entities/User";
import { UserRepository } from "../repositories/user.repository";
import { TokenService } from "../services/token.service";

export interface AccessTokenVerifier {
  verifyAccessToken(token: string): number;
}

export interface AuthenticationUserRepository {
  findById(id: number): User | undefined;
}

const authenticationRequired = () =>
  new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");

export function parseAuthorizationHeader(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return /^Bearer +([^\s]+)$/i.exec(value)?.[1];
}

export function parseSingleAuthorizationHeader(req: Request): string | undefined {
  let authorizationHeaderCount = 0;
  for (let index = 0; index < req.rawHeaders.length; index += 2) {
    if (req.rawHeaders[index]?.toLowerCase() === "authorization") {
      authorizationHeaderCount += 1;
    }
  }

  if (authorizationHeaderCount !== 1) {
    return undefined;
  }

  return parseAuthorizationHeader(req.headers.authorization);
}

export function createAuthenticationMiddleware(
  tokenVerifier: AccessTokenVerifier,
  userRepository: AuthenticationUserRepository
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (isPublicRequest(req)) {
      next();
      return;
    }

    const token = parseSingleAuthorizationHeader(req);

    if (!token) {
      next(authenticationRequired());
      return;
    }

    let userId: number;
    try {
      userId = tokenVerifier.verifyAccessToken(token);
    } catch {
      next(authenticationRequired());
      return;
    }

    const user = userRepository.findById(userId);
    if (!user || user.status !== "active") {
      next(authenticationRequired());
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    next();
  };
}

function isPublicRequest(req: Request): boolean {
  return (
    (req.method === "GET" && req.path === "/health") ||
    (req.method === "POST" && req.path === "/auth/login")
  );
}

export const authenticationMiddleware = createAuthenticationMiddleware(
  new TokenService(config.jwt),
  new UserRepository()
);
