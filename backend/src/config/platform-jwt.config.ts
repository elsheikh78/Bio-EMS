export interface PlatformJwtConfig {
  secret: string;
  expireMinutes: number;
  issuer: string;
  audience: string;
}

export class PlatformJwtConfigurationError extends Error {
  constructor() {
    super("Invalid platform JWT configuration");
    this.name = "PlatformJwtConfigurationError";
  }
}

export function loadPlatformJwtConfig(
  environment: NodeJS.ProcessEnv
): PlatformJwtConfig | undefined {
  const secret = environment.BIOEMS_PLATFORM_JWT_SECRET;
  const expireMinutesValue = environment.BIOEMS_PLATFORM_JWT_EXPIRE_MINUTES;
  const issuerValue = environment.BIOEMS_PLATFORM_JWT_ISSUER;
  const audienceValue = environment.BIOEMS_PLATFORM_JWT_AUDIENCE;
  const hasAnyPlatformJwtSetting = Boolean(
    secret || expireMinutesValue || issuerValue || audienceValue
  );

  if (!hasAnyPlatformJwtSetting) {
    return undefined;
  }

  const expireMinutes = parseExpireMinutes(expireMinutesValue);
  const issuer = issuerValue ?? "bio-ems-platform";
  const audience = audienceValue ?? "bio-ems-platform-api";

  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || !issuer || !audience) {
    throw new PlatformJwtConfigurationError();
  }

  return { secret, expireMinutes, issuer, audience };
}

function parseExpireMinutes(value: string | undefined): number {
  if (value === undefined) {
    return 15;
  }

  if (!/^\d+$/.test(value)) {
    throw new PlatformJwtConfigurationError();
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new PlatformJwtConfigurationError();
  }

  return parsed;
}
