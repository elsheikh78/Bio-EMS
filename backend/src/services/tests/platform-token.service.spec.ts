import jwt, { JwtPayload } from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { PlatformJwtConfig } from "../../config/platform-jwt.config";
import { PlatformTokenService } from "../platform-token.service";

const configuration: PlatformJwtConfig = {
  secret: "p".repeat(32),
  expireMinutes: 15,
  issuer: "bio-ems-platform",
  audience: "bio-ems-platform-api",
};

const owner = {
  kind: "platform" as const,
  type: "SYSTEM_OWNER" as const,
  id: "system-owner",
  username: "platform-owner",
};

describe("platform JWT access-token service", () => {
  it("issues an isolated SYSTEM_OWNER token with explicit platform claims", () => {
    const issued = new PlatformTokenService(configuration).issueAccessToken(owner);
    const complete = jwt.decode(issued.accessToken, { complete: true });
    const payload = complete?.payload as JwtPayload;

    expect(complete?.header.alg).toBe("HS256");
    expect(Object.keys(payload).sort()).toEqual([
      "aud",
      "exp",
      "iss",
      "principal_kind",
      "principal_type",
      "sub",
    ]);
    expect(payload).toMatchObject({
      sub: "system-owner",
      iss: "bio-ems-platform",
      aud: "bio-ems-platform-api",
      principal_kind: "platform",
      principal_type: "SYSTEM_OWNER",
    });
    expect(payload.iat).toBeUndefined();
    expect(issued.expiresIn).toBe(900);
  });

  it("verifies only the explicit platform principal claims", () => {
    const service = new PlatformTokenService(configuration);
    const issued = service.issueAccessToken(owner);

    expect(service.verifyAccessToken(issued.accessToken)).toEqual({
      principalId: "system-owner",
      principalType: "SYSTEM_OWNER",
    });

    expect(() => service.verifyAccessToken(signToken({ principal_type: "ADMIN" }))).toThrow();
    expect(() => service.verifyAccessToken(signToken({ principal_kind: "customer" }))).toThrow();
    expect(() => service.verifyAccessToken(signToken({}, { audience: "bio-ems-api" }))).toThrow();
  });

  it("does not accept a customer JWT signed for the customer trust domain", () => {
    const customerToken = jwt.sign({}, "c".repeat(32), {
      algorithm: "HS256",
      audience: "bio-ems-api",
      expiresIn: 1800,
      issuer: "bio-ems",
      noTimestamp: true,
      subject: "1",
    });

    expect(() =>
      new PlatformTokenService(configuration).verifyAccessToken(customerToken)
    ).toThrow();
  });
});

function signToken(
  overrides: Record<string, unknown> = {},
  options: { audience?: string } = {}
): string {
  return jwt.sign(
    {
      principal_kind: "platform",
      principal_type: "SYSTEM_OWNER",
      ...overrides,
    },
    configuration.secret,
    {
      algorithm: "HS256",
      audience: options.audience ?? configuration.audience,
      expiresIn: 900,
      issuer: configuration.issuer,
      noTimestamp: true,
      subject: "system-owner",
    }
  );
}
