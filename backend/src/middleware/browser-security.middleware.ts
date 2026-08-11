import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { CorsConfig } from "../config/cors.config";

export function createCorsOptions(configuration: CorsConfig): CorsOptions {
  const allowlist = new Set(configuration.allowedOrigins);

  return {
    credentials: false,
    origin(origin, callback) {
      callback(null, origin === undefined || allowlist.has(origin));
    },
  };
}

export function createBrowserSecurityMiddleware(configuration: CorsConfig) {
  return [helmet(), cors(createCorsOptions(configuration))];
}
