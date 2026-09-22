import { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors/app-error";
import { createPasswordRecoveryRateLimitMiddleware } from "../password-recovery-rate-limit.middleware";

function requestFor(ip: string): Request {
  return {
    ip,
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function responseWithHeaderSpy(): Response {
  return {
    setHeader: vi.fn(),
  } as unknown as Response;
}

describe("password recovery rate limit middleware", () => {
  it("allows five requests per client inside the window", () => {
    const middleware = createPasswordRecoveryRateLimitMiddleware(() => 1_000);
    const request = requestFor("127.0.0.1");
    const response = responseWithHeaderSpy();
    const next = vi.fn();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      middleware(request, response, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
  });

  it("rejects the sixth request with a retry-after header", () => {
    const middleware = createPasswordRecoveryRateLimitMiddleware(() => 1_000);
    const request = requestFor("127.0.0.1");
    const response = responseWithHeaderSpy();
    const next = vi.fn();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      middleware(request, response, next);
    }

    let thrown: unknown;
    try {
      middleware(request, response, next);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    expect(thrown).toMatchObject({
      statusCode: 429,
      code: "PASSWORD_RECOVERY_RATE_LIMITED",
    });
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", 900);
    expect(next).toHaveBeenCalledTimes(5);
  });

  it("opens a fresh window after expiry", () => {
    let currentTime = 1_000;
    const middleware = createPasswordRecoveryRateLimitMiddleware(() => currentTime);
    const request = requestFor("127.0.0.1");
    const response = responseWithHeaderSpy();
    const next = vi.fn();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      middleware(request, response, next);
    }

    currentTime += 15 * 60_000;
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(6);
  });

  it("tracks clients independently", () => {
    const middleware = createPasswordRecoveryRateLimitMiddleware(() => 1_000);
    const response = responseWithHeaderSpy();
    const next = vi.fn();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      middleware(requestFor("127.0.0.1"), response, next);
    }
    middleware(requestFor("127.0.0.2"), response, next);

    expect(next).toHaveBeenCalledTimes(6);
  });
});
