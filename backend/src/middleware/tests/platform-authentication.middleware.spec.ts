import { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createPlatformAuthenticationMiddleware } from "../platform-authentication.middleware";

function request(authorization?: string): Request {
  return {
    headers: authorization ? { authorization } : {},
  } as Request;
}

const response = {} as Response;

describe("platform authentication middleware", () => {
  it("attaches an active SYSTEM_OWNER to a separate platform context", () => {
    const verifier = {
      verifyAccessToken: vi.fn(() => ({
        principalId: "system-owner",
        principalType: "SYSTEM_OWNER" as const,
      })),
    };
    const repository = {
      findById: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        status: "active" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
      })),
    };
    const middleware = createPlatformAuthenticationMiddleware(verifier, repository);
    const req = request("Bearer platform-token");
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, response, next);

    expect(req.platformPrincipal).toEqual({
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: "system-owner",
      username: "platform-owner",
    });
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ["missing token", undefined],
    ["malformed bearer token", "Basic abc"],
  ])("rejects %s", (_case, authorization) => {
    const middleware = createPlatformAuthenticationMiddleware(
      { verifyAccessToken: vi.fn() },
      { findById: vi.fn() }
    );
    const next = vi.fn() as unknown as NextFunction;

    middleware(request(authorization), response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "PLATFORM_AUTHENTICATION_REQUIRED" })
    );
  });

  it("rejects tokens from another trust domain without consulting platform storage", () => {
    const verifier = {
      verifyAccessToken: vi.fn(() => {
        throw new Error("invalid");
      }),
    };
    const repository = { findById: vi.fn() };
    const middleware = createPlatformAuthenticationMiddleware(verifier, repository);
    const next = vi.fn() as unknown as NextFunction;

    middleware(request("Bearer customer-token"), response, next);

    expect(repository.findById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "PLATFORM_AUTHENTICATION_REQUIRED" })
    );
  });

  it("rejects disabled or missing platform principals", () => {
    const verifier = {
      verifyAccessToken: vi.fn(() => ({
        principalId: "system-owner",
        principalType: "SYSTEM_OWNER" as const,
      })),
    };
    const repository = {
      findById: vi.fn(() => ({
        id: "system-owner",
        principal_type: "SYSTEM_OWNER" as const,
        username: "platform-owner",
        status: "disabled" as const,
        created_at: "2026-08-24T00:00:00.000Z",
        updated_at: null,
      })),
    };
    const middleware = createPlatformAuthenticationMiddleware(verifier, repository);
    const next = vi.fn() as unknown as NextFunction;

    middleware(request("Bearer platform-token"), response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "PLATFORM_AUTHENTICATION_REQUIRED" })
    );
  });
});
