import { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createCustomerLoginRateLimitMiddleware } from "../customer-login-rate-limit.middleware";

const req = (ip: string) =>
  ({
    ip,
    socket: {},
    headers: { "x-forwarded-for": Math.random().toString() },
  }) as unknown as Request;
const res = () => ({ setHeader: vi.fn() }) as unknown as Response;

describe("customer login limiter", () => {
  it("bounds attempts regardless of username/header churn and permits retry after the window", () => {
    let time = 1000;
    const limit = createCustomerLoginRateLimitMiddleware(() => time);
    const next = vi.fn() as NextFunction;
    const response = res();
    for (let i = 0; i < 10; i++) limit(req("a"), response, next);
    expect(() => limit(req("a"), response, next)).toThrowError(
      expect.objectContaining({ statusCode: 429, code: "CUSTOMER_LOGIN_RATE_LIMITED" })
    );
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", 60);
    limit(req("b"), response, next);
    expect(next).toHaveBeenCalledTimes(11);
    time += 60_000;
    limit(req("a"), response, next);
    expect(next).toHaveBeenCalledTimes(12);
  });
  it("does not let address churn evict an unexpired exhausted client", () => {
    const limit = createCustomerLoginRateLimitMiddleware(() => 1000);
    const next = vi.fn() as NextFunction;
    for (let i = 0; i < 10; i++) limit(req("original"), res(), next);
    for (let i = 0; i < 1023; i++) limit(req(String(i)), res(), next);
    expect(() => limit(req("overflow"), res(), next)).toThrow();
    expect(() => limit(req("original"), res(), next)).toThrow();
  });
});
