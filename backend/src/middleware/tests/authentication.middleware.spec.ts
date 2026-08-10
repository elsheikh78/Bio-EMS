import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.BIOEMS_JWT_SECRET = "s".repeat(32);
});

import { User } from "../../entities/User";
import { JwtConfig } from "../../config/jwt.config";
import { TokenService } from "../../services/token.service";
import { errorMiddleware } from "../error.middleware";
import {
  AccessTokenVerifier,
  AuthenticationUserRepository,
  createAuthenticationMiddleware,
  parseAuthorizationHeader,
} from "../authentication.middleware";

const activeUser = (overrides: Partial<User> = {}): User => ({
  id: 7,
  username: "operator",
  email: null,
  role: "OPERATOR",
  status: "active",
  created_at: "2026-08-10 00:00:00",
  updated_at: null,
  ...overrides,
});

describe("Authorization header parser", () => {
  it.each([
    ["Bearer token", "token"],
    ["bearer token", "token"],
    ["BEARER token", "token"],
    ["Bearer   token", "token"],
  ])("accepts %j", (header, token) => {
    expect(parseAuthorizationHeader(header)).toBe(token);
  });

  it.each([
    undefined,
    ["Bearer one", "Bearer two"],
    "",
    "Basic token",
    "Bearer",
    "Bearer ",
    "Bearer\ttoken",
    " Bearer token",
    "Bearer token ",
    "Bearer token extra",
  ])("rejects malformed representation %j", (header) => {
    expect(parseAuthorizationHeader(header)).toBeUndefined();
  });
});

describe("Authentication middleware", () => {
  const verifyAccessToken = vi.fn<AccessTokenVerifier["verifyAccessToken"]>();
  const findById = vi.fn<AuthenticationUserRepository["findById"]>();
  const protectedHandler = vi.fn((_req, res) => res.json({ success: true }));
  const app = express();

  app.use(express.json());
  app.use("/api/v1", createAuthenticationMiddleware({ verifyAccessToken }, { findById }));
  app.get("/api/v1/health", protectedHandler);
  app.post("/api/v1/auth/login", protectedHandler);
  app.get("/api/v1/protected", protectedHandler);
  app.get("/api/v1/principal", (req, res) => res.json(req.user));
  app.use(errorMiddleware);

  beforeEach(() => {
    vi.clearAllMocks();
    verifyAccessToken.mockReturnValue(7);
    findById.mockReturnValue(activeUser());
  });

  it("attaches only the current persisted identity and invokes downstream once", async () => {
    const response = await request(app)
      .get("/api/v1/principal")
      .set("Authorization", "Bearer signed-token")
      .expect(200);

    expect(response.body).toEqual({ id: 7, username: "operator", role: "OPERATOR" });
    expect(verifyAccessToken).toHaveBeenCalledOnce();
    expect(verifyAccessToken).toHaveBeenCalledWith("signed-token");
    expect(findById).toHaveBeenCalledOnce();
    expect(findById).toHaveBeenCalledWith(7);
  });

  it.each([undefined, "Basic token", "Bearer\ttoken"])(
    "returns the generic 401 without verifying malformed header %j",
    async (authorization) => {
      const operation = request(app).get("/api/v1/protected");
      if (authorization !== undefined) operation.set("Authorization", authorization);
      const response = await operation.expect(401);

      expect(response.body).toEqual({
        success: false,
        error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication required" },
      });
      expect(verifyAccessToken).not.toHaveBeenCalled();
      expect(findById).not.toHaveBeenCalled();
      expect(protectedHandler).not.toHaveBeenCalled();
    }
  );

  it("rejects duplicate Authorization headers before token verification", () => {
    const next = vi.fn();
    const middleware = createAuthenticationMiddleware({ verifyAccessToken }, { findById });
    middleware(
      {
        method: "GET",
        path: "/protected",
        headers: { authorization: "Bearer first" },
        rawHeaders: ["Authorization", "Bearer first", "authorization", "Bearer second"],
      } as express.Request,
      {} as express.Response,
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "AUTHENTICATION_REQUIRED" })
    );
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it("counts only header names when checking for duplicate Authorization fields", () => {
    const next = vi.fn();
    const middleware = createAuthenticationMiddleware({ verifyAccessToken }, { findById });
    middleware(
      {
        method: "GET",
        path: "/protected",
        headers: { authorization: "Bearer signed-token" },
        rawHeaders: ["X-Label", "authorization", "Authorization", "Bearer signed-token"],
      } as express.Request,
      {} as express.Response,
      next
    );

    expect(verifyAccessToken).toHaveBeenCalledWith("signed-token");
    expect(findById).toHaveBeenCalledWith(7);
    expect(next).toHaveBeenCalledWith();
  });

  it("maps verifier failures to the generic safe response without a User lookup", async () => {
    verifyAccessToken.mockImplementation(() => {
      throw new Error("jwt malformed: sensitive-token");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await request(app)
      .get("/api/v1/protected")
      .set("Authorization", "Bearer sensitive-token")
      .expect(401);

    expect(JSON.stringify(response.body)).not.toMatch(/jwt|sensitive-token|secret|password/i);
    expect(findById).not.toHaveBeenCalled();
    expect(protectedHandler).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it.each([
    ["missing", undefined],
    ["disabled", activeUser({ status: "disabled" })],
  ])("rejects a %s persisted User", async (_case, user) => {
    findById.mockReturnValue(user);

    const response = await request(app)
      .get("/api/v1/protected")
      .set("Authorization", "Bearer signed-token")
      .expect(401);

    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    expect(findById).toHaveBeenCalledWith(7);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it("looks up SQLite on every request and reflects a current role change", async () => {
    findById
      .mockReturnValueOnce(activeUser({ role: "VIEWER" }))
      .mockReturnValueOnce(activeUser({ role: "ADMIN" }));

    const first = await request(app)
      .get("/api/v1/principal")
      .set("Authorization", "Bearer signed-token")
      .expect(200);
    const second = await request(app)
      .get("/api/v1/principal")
      .set("Authorization", "Bearer signed-token")
      .expect(200);

    expect(first.body.role).toBe("VIEWER");
    expect(second.body.role).toBe("ADMIN");
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it("ignores forged identity and status claims in favor of the persisted User", async () => {
    const configuration: JwtConfig = {
      secret: "s".repeat(32),
      expireMinutes: 30,
      issuer: "bio-ems",
      audience: "bio-ems-api",
    };
    const token = jwt.sign(
      { role: "ADMIN", status: "disabled", username: "forged", email: "secret@example.com" },
      configuration.secret,
      {
        algorithm: "HS256",
        audience: configuration.audience,
        expiresIn: 1800,
        issuer: configuration.issuer,
        subject: "7",
      }
    );
    const isolatedApp = express();
    isolatedApp.use(
      createAuthenticationMiddleware(new TokenService(configuration), {
        findById: () => activeUser({ role: "VIEWER", username: "persisted" }),
      })
    );
    isolatedApp.get("/principal", (req, res) => res.json(req.user));
    isolatedApp.use(errorMiddleware);

    const response = await request(isolatedApp)
      .get("/principal")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ id: 7, username: "persisted", role: "VIEWER" });
    expect(JSON.stringify(response.body)).not.toMatch(/disabled|secret@example|forged/);
  });

  it("makes disablement effective on the request after token issuance", async () => {
    findById
      .mockReturnValueOnce(activeUser())
      .mockReturnValueOnce(activeUser({ status: "disabled" }));

    await request(app)
      .get("/api/v1/protected")
      .set("Authorization", "Bearer signed-token")
      .expect(200);
    await request(app)
      .get("/api/v1/protected")
      .set("Authorization", "Bearer signed-token")
      .expect(401);

    expect(protectedHandler).toHaveBeenCalledOnce();
    expect(findById).toHaveBeenCalledTimes(2);
  });

  it("keeps only GET Health and POST Login public", async () => {
    await request(app).get("/api/v1/health").expect(200);
    await request(app).post("/api/v1/auth/login").send({}).expect(200);
    await request(app).get("/api/v1/auth/login").expect(401);
    await request(app).post("/api/v1/health").expect(401);
  });
});
