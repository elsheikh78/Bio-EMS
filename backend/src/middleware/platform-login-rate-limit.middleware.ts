import { createLoginRateLimiter } from "./login-rate-limit";

export function createPlatformLoginRateLimitMiddleware(
  now: () => number = () => Date.now(),
  attempts = new Map<string, { count: number; resetAt: number }>()
) {
  return createLoginRateLimiter("PLATFORM_LOGIN_RATE_LIMITED", now, attempts);
}

export const platformLoginRateLimitMiddleware = createPlatformLoginRateLimitMiddleware();
