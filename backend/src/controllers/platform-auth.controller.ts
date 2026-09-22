import { sqlite } from "../../database/sqlite/client";
import { Request, Response } from "express";
import { config } from "../config/config";
import { AppError } from "../errors/app-error";
import { asyncHandler } from "../middleware/async-handler";
import { PlatformPrincipalRepository } from "../repositories/platform-principal.repository";
import { PlatformAuthService } from "../services/platform-auth.service";
import { OwnerMfaService } from "../services/owner-mfa.service";
import { OwnerSecurityAuditService } from "../services/owner-security-audit.service";
import { OwnerSupportGrantService } from "../services/owner-support-grant.service";
import { PlatformSessionService } from "../services/platform-session.service";
import { PlatformTokenService } from "../services/platform-token.service";

const ownerSecurityAuditService = () => new OwnerSecurityAuditService(sqlite);

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
    new PlatformSessionService(sqlite),
    config.ownerMfaEncryptionKey
      ? new OwnerMfaService(new PlatformPrincipalRepository(), config.ownerMfaEncryptionKey)
      : undefined,
    ownerSecurityAuditService()
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
  ownerSecurityAuditService().record({
    action: "OWNER_SESSION_REVOKED",
    result: "SUCCESS",
    principalId: req.platformPrincipal!.id,
    username: req.platformPrincipal!.username,
    sessionId: req.platformSessionId,
  });
  res.status(204).send();
};

export const revokeAllPlatformSessionsController = (req: Request, res: Response): void => {
  const revoked = new PlatformSessionService(sqlite).revokeAll(req.platformPrincipal!.id);
  ownerSecurityAuditService().record({
    action: "OWNER_ALL_SESSIONS_REVOKED",
    result: "SUCCESS",
    principalId: req.platformPrincipal!.id,
    username: req.platformPrincipal!.username,
    reason: `REVOKED_COUNT:${revoked}`,
  });
  res.status(200).json({ revoked_sessions: revoked });
};

function ownerMfaService(): OwnerMfaService {
  if (!config.ownerMfaEncryptionKey) {
    throw new AppError("Owner MFA unavailable", 503, "OWNER_MFA_UNAVAILABLE");
  }
  return new OwnerMfaService(new PlatformPrincipalRepository(), config.ownerMfaEncryptionKey);
}

export const beginOwnerMfaEnrollmentController = (req: Request, res: Response): void => {
  try {
    const enrollment = ownerMfaService().beginEnrollment(req.platformPrincipal!.id);
    ownerSecurityAuditService().record({
      action: "OWNER_MFA_ENROLLMENT_STARTED",
      result: "SUCCESS",
      principalId: req.platformPrincipal!.id,
      username: req.platformPrincipal!.username,
    });
    res.status(201).json({
      secret: enrollment.secret,
      otpauth_uri: enrollment.otpauthUri,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Owner MFA enrollment unavailable", 409, "OWNER_MFA_ENROLLMENT_UNAVAILABLE");
  }
};

export const confirmOwnerMfaEnrollmentController = (req: Request, res: Response): void => {
  try {
    ownerMfaService().confirmEnrollment(req.platformPrincipal!.id, req.body.code);
    ownerSecurityAuditService().record({
      action: "OWNER_MFA_ENABLED",
      result: "SUCCESS",
      principalId: req.platformPrincipal!.id,
      username: req.platformPrincipal!.username,
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Owner MFA confirmation rejected", 400, "OWNER_MFA_CONFIRMATION_REJECTED");
  }
};

const ownerSupportGrantService = () => new OwnerSupportGrantService(sqlite);

export const listOwnerSupportGrantsController = (req: Request, res: Response): void => {
  res.status(200).json({
    grants: ownerSupportGrantService().list(req.platformPrincipal!.id),
  });
};

export const issueOwnerSupportGrantController = (req: Request, res: Response): void => {
  try {
    const grant = ownerSupportGrantService().issue(
      req.platformPrincipal!.id,
      req.body.site_id ?? null,
      req.body.reason,
      req.body.duration_minutes
    );
    if (!config.platformJwt) throw unavailable();
    const expiresIn = Math.max(
      1,
      Math.floor((new Date(grant.expiresAt).getTime() - new Date(grant.issuedAt).getTime()) / 1000)
    );
    const issued = new PlatformTokenService(config.platformJwt).issueSupportToken(
      req.platformPrincipal!,
      grant.id,
      grant.siteId,
      expiresIn
    );
    res.status(201).json({
      grant,
      support_token: issued.supportToken,
      token_type: "bearer",
      expires_in: issued.expiresIn,
    });
  } catch {
    throw new AppError("Owner support grant rejected", 400, "OWNER_SUPPORT_GRANT_REJECTED");
  }
};

export const revokeOwnerSupportGrantController = (req: Request, res: Response): void => {
  try {
    const revoked = ownerSupportGrantService().revoke(
      req.params.grantId as string,
      req.platformPrincipal!.id,
      req.body.reason
    );
    if (!revoked) {
      throw new AppError("Owner support grant not found", 404, "OWNER_SUPPORT_GRANT_NOT_FOUND");
    }
    res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Owner support grant rejected", 400, "OWNER_SUPPORT_GRANT_REJECTED");
  }
};
