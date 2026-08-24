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
  },
  login: vi.fn(),
}));

vi.mock("../../config/config", () => ({ config: mocks.config }));

vi.mock("../../repositories/platform-principal.repository", () => ({
  PlatformPrincipalRepository: class {},
}));

vi.mock("../../services/platform-token.service", () => ({
  PlatformTokenService: class {},
}));

vi.mock("../../services/platform-auth.service", () => ({
  PlatformAuthService: class {
    login = mocks.login;
  },
}));

vi.mock("../../middleware/platform-authentication.middleware", async () => {
  const { AppError } = await import("../../errors/app-error");

  return {
    platformAuthenticationMiddleware: (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.headers.authorization !== "Bearer platform-token") {
        next(
          new AppError("Platform authentication required", 401, "PLATFORM_AUTHENTICATION_REQUIRED")
        );
        return;
      }

      req.platformPrincipal = {
        kind: "platform",
        type: "SYSTEM_OWNER",
        id: "system-owner",
        username: "platform-owner",
      };
      next();
    },
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

    expect(mocks.login).toHaveBeenCalledWith({
      username: "platform-owner",
      password: "owner-password",
    });
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
