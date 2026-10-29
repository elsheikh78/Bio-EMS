import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

const WINDOW_MILLISECONDS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const MAX_TRACKED_CLIENTS = 1_024;

type AttemptWindow = { count: number; resetAt: number };

export function createLoginRateLimiter(
  errorCode: string,
  now: () => number = () => Date.now(),
  attempts = new Map<string, AttemptWindow>()
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const time = now();
    // Express must retain its explicit trusted-proxy policy; never read X-Forwarded-For here.
    const client = request.ip || request.socket.remoteAddress || "unknown";
    const reject = (resetAt: number): never => {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((resetAt - time) / 1000)));
      throw new AppError("Too many authentication attempts", 429, errorCode);
    };
    const current = attempts.get(client);
    if (current && current.resetAt > time) {
      if (current.count >= MAX_ATTEMPTS_PER_WINDOW) reject(current.resetAt);
      current.count += 1;
      next();
      return;
    }
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      for (const [key, value] of attempts) {
        if (value.resetAt <= time) attempts.delete(key);
      }
      // Do not evict an unexpired bucket: address churn must not reset another client's limit.
      if (attempts.size >= MAX_TRACKED_CLIENTS && !attempts.has(client)) {
        reject(Math.min(...Array.from(attempts.values(), (value) => value.resetAt)));
      }
    }
    attempts.set(client, { count: 1, resetAt: time + WINDOW_MILLISECONDS });
    next();
  };
}
