import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 12;
const MAX_CLIENTS = 1_024;

type Window = { count: number; resetAt: number };

export function createDevicePairingRateLimitMiddleware(
  now: () => number = () => Date.now(),
  attempts = new Map<string, Window>()
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const currentTime = now();
    const client = request.ip || request.socket.remoteAddress || "unknown";
    const current = attempts.get(client);

    if (!current || current.resetAt <= currentTime) {
      if (attempts.size >= MAX_CLIENTS) {
        for (const [key, value] of attempts) {
          if (value.resetAt <= currentTime) attempts.delete(key);
        }
        if (attempts.size >= MAX_CLIENTS) attempts.delete(attempts.keys().next().value!);
      }
      attempts.set(client, { count: 1, resetAt: currentTime + WINDOW_MS });
      next();
      return;
    }

    if (current.count >= MAX_ATTEMPTS) {
      response.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((current.resetAt - currentTime) / 1000))
      );
      throw new AppError("Too many device pairing attempts", 429, "DEVICE_PAIRING_RATE_LIMITED");
    }

    current.count += 1;
    next();
  };
}

export const devicePairingRateLimitMiddleware = createDevicePairingRateLimitMiddleware();
