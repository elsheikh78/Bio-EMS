export interface JwtConfig {
  secret: string;
  expireMinutes: number;
  issuer: string;
  audience: string;
}

export class JwtConfigurationError extends Error {
  constructor() {
    super("Invalid JWT configuration");
    this.name = "JwtConfigurationError";
  }
}

export function loadJwtConfig(environment: NodeJS.ProcessEnv): JwtConfig {
  const secret = environment.BIOEMS_JWT_SECRET;
  const expireMinutes = parseExpireMinutes(environment.BIOEMS_JWT_EXPIRE_MINUTES);
  const issuer = environment.BIOEMS_JWT_ISSUER ?? "bio-ems";
  const audience = environment.BIOEMS_JWT_AUDIENCE ?? "bio-ems-api";

  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || !issuer || !audience) {
    throw new JwtConfigurationError();
  }

  return { secret, expireMinutes, issuer, audience };
}

function parseExpireMinutes(value: string | undefined): number {
  if (value === undefined) {
    return 30;
  }

  if (!/^\d+$/.test(value)) {
    throw new JwtConfigurationError();
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new JwtConfigurationError();
  }

  return parsed;
}
