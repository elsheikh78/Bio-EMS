import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

const WINDOW_MILLISECONDS = 15 * 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const MAX_TRACKED_CLIENTS = 1_024;

type AttemptWindow = {
  count: number;
  resetAt: number;
};

export function createPasswordRecoveryRateLimitMiddleware(
  now: () => number = () => Date.now(),
  attempts = new Map<string, AttemptWindow>()
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const currentTime = now();
    const client = request.ip || request.socket.remoteAddress || "unknown";
    const current = attempts.get(client);

    if (!current || current.resetAt <= currentTime) {
      if (attempts.size >= MAX_TRACKED_CLIENTS) {
        for (const [key, value] of attempts) {
          if (value.resetAt <= currentTime) attempts.delete(key);
        }
        if (attempts.size >= MAX_TRACKED_CLIENTS) {
          attempts.delete(attempts.keys().next().value!);
        }
      }
      attempts.set(client, {
        count: 1,
        resetAt: currentTime + WINDOW_MILLISECONDS,
      });
      next();
      return;
    }

    if (current.count >= MAX_ATTEMPTS_PER_WINDOW) {
      response.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((current.resetAt - currentTime) / 1000))
      );
      throw new AppError(
        "Too many password recovery requests",
        429,
        "PASSWORD_RECOVERY_RATE_LIMITED"
      );
    }

    current.count += 1;
    next();
  };
}

export const passwordRecoveryRateLimitMiddleware = createPasswordRecoveryRateLimitMiddleware();
