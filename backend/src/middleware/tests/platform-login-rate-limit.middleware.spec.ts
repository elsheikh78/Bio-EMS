import { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createPlatformLoginRateLimitMiddleware } from "../platform-login-rate-limit.middleware";

function request(ip: string): Request {
  return { ip, socket: {} } as Request;
}

function response() {
  return { setHeader: vi.fn() } as unknown as Response;
}

describe("platform owner login rate limit", () => {
  it("allows ten attempts and rejects the next one with a retry boundary", () => {
    let now = 1_000;
    const middleware = createPlatformLoginRateLimitMiddleware(() => now);
    const next = vi.fn() as NextFunction;
    const res = response();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      middleware(request("10.0.0.5"), res, next);
    }

    expect(next).toHaveBeenCalledTimes(10);
    expect(() => middleware(request("10.0.0.5"), res, next)).toThrowError(
      expect.objectContaining({
        statusCode: 429,
        code: "PLATFORM_LOGIN_RATE_LIMITED",
      })
    );
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 60);

    now += 60_000;
    middleware(request("10.0.0.5"), res, next);
    expect(next).toHaveBeenCalledTimes(11);
  });

  it("tracks clients independently", () => {
    const middleware = createPlatformLoginRateLimitMiddleware(() => 1_000);
    const next = vi.fn() as NextFunction;
    const res = response();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      middleware(request("10.0.0.5"), res, next);
    }
    middleware(request("10.0.0.6"), res, next);

    expect(next).toHaveBeenCalledTimes(11);
  });
});
