import { createLoginRateLimiter } from "./login-rate-limit";

export const createCustomerLoginRateLimitMiddleware = (now: () => number = () => Date.now()) =>
  createLoginRateLimiter("CUSTOMER_LOGIN_RATE_LIMITED", now);

export const customerLoginRateLimitMiddleware = createCustomerLoginRateLimitMiddleware();
