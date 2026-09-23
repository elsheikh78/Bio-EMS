import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../../middleware/error.middleware";

const mocks = vi.hoisted(() => ({
  config: {
    platformJwt: {
      secret: "p".repeat(32),
      expireMinutes: 15,
      issuer: "bio-ems-platform",
      audience: "bio-ems-platform-api",
    } as
      | {
          secret: string;
          expireMinutes: number;
          issuer: string;
          audience: string;
        }
      | undefined,
    ownerMfaEncryptionKey: Buffer.alloc(32, 1),
  },
  login: vi.fn(),
  findOwnerCredentials: vi.fn(),
  resetMfaEnrollment: vi.fn(),
  verifyPassword: vi.fn(),
  verifyMfaLoginCode: vi.fn(),
  beginMfaEnrollment: vi.fn(),
  issueMfaEnrollmentToken: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllSessions: vi.fn(),
  listSupportGrants: vi.fn(),
  issueSupportGrant: vi.fn(),
  revokeSupportGrant: vi.fn(),
  recordSecurityAudit: vi.fn(),
}));

vi.mock("../../config/config", () => ({ config: mocks.config }));

vi.mock("../../repositories/platform-principal.repository", () => ({
  PlatformPrincipalRepository: class {
    findCredentialsByUsername = mocks.findOwnerCredentials;
    resetMfaEnrollment = mocks.resetMfaEnrollment;
  },
}));

vi.mock("../../services/platform-token.service", () => ({
  PlatformTokenService: class {
    issueMfaEnrollmentToken = mocks.issueMfaEnrollmentToken;
    issueSupportToken = vi.fn(() => ({
      supportToken: "support-token",
      expiresIn: 1800,
    }));
  },
}));

vi.mock("../../services/platform-session.service", () => ({
  PlatformSessionService: class {
    revoke = mocks.revokeSession;
    revokeAll = mocks.revokeAllSessions;
  },
}));

vi.mock("../../services/owner-support-grant.service", () => ({
  OwnerSupportGrantService: class {
    list = mocks.listSupportGrants;
    issue = mocks.issueSupportGrant;
    revoke = mocks.revokeSupportGrant;
  },
}));

vi.mock("../../services/owner-security-audit.service", () => ({
  OwnerSecurityAuditService: class {
    record = mocks.recordSecurityAudit;
  },
}));

vi.mock("../../services/platform-auth.service", () => ({
  PlatformAuthService: class {
    login = mocks.login;
  },
}));

vi.mock("../../services/password.service", () => ({
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("../../services/owner-mfa.service", () => ({
  OwnerMfaService: class {
    verifyLoginCode = mocks.verifyMfaLoginCode;
    beginEnrollment = mocks.beginMfaEnrollment;
  },
}));

vi.mock("../../middleware/platform-authentication.middleware", async () => {
  const { AppError } = await import("../../errors/app-error");
  const authenticate = (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    if (
      req.headers.authorization !== "Bearer platform-token" &&
      req.headers.authorization !== "Bearer enrollment-token"
    ) {
      next(
        new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED")
      );
      return;
    }

    req.platformSessionId = "session-id";
    req.platformPrincipal = {
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: "system-owner",
      username: "platform-owner",
    };
    next();
  };

  return {
    platformAuthenticationMiddleware: authenticate,
    ownerMfaEnrollmentAuthenticationMiddleware: authenticate,
  };
});

import platformAuthRouter from "../platform-auth.route";

const app = express();
app.use(express.json());
app.use("/api/v1/platform-auth", platformAuthRouter);
app.use(errorMiddleware);

describe("Platform Login REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.platformJwt = {
      secret: "p".repeat(32),
      expireMinutes: 15,
      issuer: "bio-ems-platform",
      audience: "bio-ems-platform-api",
    };
  });

  it("returns an isolated SYSTEM_OWNER access token without sensitive fields", async () => {
    mocks.login.mockResolvedValue({
      access_token: "platform-token",
      token_type: "bearer",
      expires_in: 900,
      principal: {
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      },
    });

    const response = await request(app)
      .post("/api/v1/platform-auth/login")
      .send({ username: " Platform-Owner ", password: "owner-password" })
      .expect(200);

    expect(mocks.login).toHaveBeenCalledWith(
      {
        username: "platform-owner",
        password: "owner-password",
      },
      {
        ipAddress: "::ffff:127.0.0.1",
        userAgent: undefined,
      }
    );
    expect(response.body.principal.type).toBe("SYSTEM_OWNER");
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|owner-password|secret/i);
  });

  it.each([
    {},
    { username: "platform-owner", password: "" },
    { username: "platform-owner", password: "password", role: "SYSTEM_OWNER" },
  ])("returns 400 without invoking the service for invalid input", async (body) => {
    const response = await request(app).post("/api/v1/platform-auth/login").send(body).expect(400);

    expect(response.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
    });
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("fails closed when platform authentication is not configured", async () => {
    mocks.config.platformJwt = undefined;

    const response = await request(app)
      .post("/api/v1/platform-auth/login")
      .send({ username: "platform-owner", password: "owner-password" })
      .expect(503);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: "PLATFORM_AUTH_UNAVAILABLE",
        message: "Platform authentication unavailable",
      },
    });
    expect(mocks.login).not.toHaveBeenCalled();
  });
});

it("revokes the current persisted session during logout", async () => {
  mocks.revokeSession.mockReturnValue(true);

  await request(app)
    .post("/api/v1/platform-auth/logout")
    .set("Authorization", "Bearer platform-token")
    .expect(204);

  expect(mocks.revokeSession).toHaveBeenCalledWith("session-id", "system-owner");
});

it("revokes every persisted owner session", async () => {
  mocks.revokeAllSessions.mockReturnValue(3);

  const response = await request(app)
    .post("/api/v1/platform-auth/sessions/revoke-all")
    .set("Authorization", "Bearer platform-token")
    .expect(200);

  expect(mocks.revokeAllSessions).toHaveBeenCalledWith("system-owner");
  expect(response.body).toEqual({ revoked_sessions: 3 });
});

it.each(["/logout", "/sessions/revoke-all"])("protects POST /platform-auth%s", async (path) => {
  await request(app).post(`/api/v1/platform-auth${path}`).expect(401);
});

describe("Owner MFA rotation REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.platformJwt = {
      secret: "p".repeat(32),
      expireMinutes: 15,
      issuer: "bio-ems-platform",
      audience: "bio-ems-platform-api",
    };
    mocks.findOwnerCredentials.mockReturnValue({
      id: "system-owner",
      principal_type: "SYSTEM_OWNER",
      username: "platform-owner",
      status: "active",
      created_at: "2026-09-23T10:00:00.000Z",
      updated_at: null,
      password_hash: "$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345",
      failed_login_count: 0,
      locked_until: null,
      last_failed_login_at: null,
      mfa_secret_encrypted: "v1.encrypted",
      mfa_enabled_at: "2026-09-23T10:46:20.827Z",
      mfa_recovery_hashes: null,
      session_version: 1,
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.verifyMfaLoginCode.mockReturnValue(true);
    mocks.resetMfaEnrollment.mockReturnValue(true);
    mocks.beginMfaEnrollment.mockReturnValue({
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUri: "otpauth://totp/BIO-EMS%3Aplatform-owner?secret=JBSWY3DPEHPK3PXP",
    });
    mocks.issueMfaEnrollmentToken.mockReturnValue({
      enrollmentToken: "new-enrollment-token",
      expiresIn: 300,
    });
    mocks.revokeAllSessions.mockReturnValue(2);
  });

  it("rotates MFA only after password and current TOTP reauthentication", async () => {
    const response = await request(app)
      .post("/api/v1/platform-auth/mfa/reset")
      .set("Authorization", "Bearer platform-token")
      .send({ current_password: "owner-password", current_code: "123456" })
      .expect(201);

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "owner-password",
      expect.any(String)
    );
    expect(mocks.verifyMfaLoginCode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "system-owner" }),
      "123456"
    );
    expect(mocks.resetMfaEnrollment).toHaveBeenCalledWith("system-owner");
    expect(mocks.beginMfaEnrollment).toHaveBeenCalledWith("system-owner");
    expect(mocks.revokeAllSessions).toHaveBeenCalledWith(
      "system-owner",
      "OWNER_MFA_RESET"
    );
    expect(response.body).toMatchObject({
      mfa_enrollment_required: true,
      enrollment_token: "new-enrollment-token",
      token_type: "bearer",
      expires_in: 300,
      secret: "JBSWY3DPEHPK3PXP",
    });
  });

  it("rejects MFA rotation when reauthentication fails", async () => {
    mocks.verifyPassword.mockResolvedValue(false);

    const response = await request(app)
      .post("/api/v1/platform-auth/mfa/reset")
      .set("Authorization", "Bearer platform-token")
      .send({ current_password: "wrong-password", current_code: "123456" })
      .expect(401);

    expect(response.body.error.code).toBe("OWNER_REAUTHENTICATION_REQUIRED");
    expect(mocks.resetMfaEnrollment).not.toHaveBeenCalled();
    expect(mocks.revokeAllSessions).not.toHaveBeenCalled();
  });

  it("protects and validates MFA rotation", async () => {
    await request(app)
      .post("/api/v1/platform-auth/mfa/reset")
      .send({ current_password: "owner-password", current_code: "123456" })
      .expect(401);

    await request(app)
      .post("/api/v1/platform-auth/mfa/reset")
      .set("Authorization", "Bearer platform-token")
      .send({ current_password: "owner-password", current_code: "12345" })
      .expect(400);
  });
});

describe("Owner support grant REST API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.platformJwt = {
      secret: "p".repeat(32),
      expireMinutes: 15,
      issuer: "bio-ems-platform",
      audience: "bio-ems-platform-api",
    };
  });

  it("issues, lists, and revokes grants through the authenticated owner boundary", async () => {
    const grant = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      principalId: "system-owner",
      siteId: 7,
      reason: "Investigate sensor outage",
      issuedAt: "2026-09-15T10:00:00.000Z",
      expiresAt: "2026-09-15T10:30:00.000Z",
      revokedAt: null,
    };
    mocks.issueSupportGrant.mockReturnValue(grant);
    mocks.listSupportGrants.mockReturnValue([grant]);
    mocks.revokeSupportGrant.mockReturnValue(true);

    await request(app)
      .post("/api/v1/platform-auth/support-grants")
      .set("Authorization", "Bearer platform-token")
      .send({ site_id: 7, reason: "Investigate sensor outage", duration_minutes: 30 })
      .expect(201);
    expect(mocks.issueSupportGrant).toHaveBeenCalledWith(
      "system-owner",
      7,
      "Investigate sensor outage",
      30
    );

    const listed = await request(app)
      .get("/api/v1/platform-auth/support-grants")
      .set("Authorization", "Bearer platform-token")
      .expect(200);
    expect(listed.body).toEqual({ grants: [grant] });

    await request(app)
      .post("/api/v1/platform-auth/support-grants/123e4567-e89b-12d3-a456-426614174000/revoke")
      .set("Authorization", "Bearer platform-token")
      .send({ reason: "Customer ended support" })
      .expect(204);
    expect(mocks.revokeSupportGrant).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174000",
      "system-owner",
      "Customer ended support"
    );
  });

  it("rejects unauthenticated and overlong support grants before service invocation", async () => {
    await request(app)
      .post("/api/v1/platform-auth/support-grants")
      .send({ site_id: 7, reason: "Investigate sensor outage", duration_minutes: 30 })
      .expect(401);

    await request(app)
      .post("/api/v1/platform-auth/support-grants")
      .set("Authorization", "Bearer platform-token")
      .send({ site_id: 7, reason: "Investigate sensor outage", duration_minutes: 481 })
      .expect(400);

    expect(mocks.issueSupportGrant).not.toHaveBeenCalled();
  });
});

describe("Current Platform Principal REST API", () => {
  it("returns only the isolated platform principal", async () => {
    const response = await request(app)
      .get("/api/v1/platform-auth/me")
      .set("Authorization", "Bearer platform-token")
      .expect(200);

    expect(response.body).toEqual({
      principal: {
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash|email|customer/i);
  });

  it("rejects missing or customer-domain tokens", async () => {
    await request(app).get("/api/v1/platform-auth/me").expect(401);
    await request(app)
      .get("/api/v1/platform-auth/me")
      .set("Authorization", "Bearer customer-token")
      .expect(401);
  });
});
