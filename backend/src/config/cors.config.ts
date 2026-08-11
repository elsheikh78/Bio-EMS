export interface CorsConfig {
  allowedOrigins: readonly string[];
}

export class CorsConfigurationError extends Error {
  constructor() {
    super("Invalid CORS configuration");
    this.name = "CorsConfigurationError";
  }
}

const DEVELOPMENT_ORIGIN = "http://localhost:5173";

export function loadCorsConfig(environment: NodeJS.ProcessEnv): CorsConfig {
  const configured = environment.BIOEMS_CORS_ALLOWED_ORIGINS;
  const nodeEnvironment = environment.NODE_ENV ?? "development";

  if (configured === undefined || configured.trim() === "") {
    return {
      allowedOrigins: nodeEnvironment === "production" ? [] : [DEVELOPMENT_ORIGIN],
    };
  }

  const origins = configured.split(",").map((origin) => origin.trim());
  if (origins.some((origin) => !isValidOrigin(origin))) {
    throw new CorsConfigurationError();
  }

  return { allowedOrigins: [...new Set(origins)] };
}

function isValidOrigin(value: string): boolean {
  if (!value || value === "*") return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}
