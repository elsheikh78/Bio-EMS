import { createHmac, generateKeyPairSync } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { JwtConfig } from "../../config/jwt.config";
import { TokenService } from "../token.service";

const configuration: JwtConfig = {
  secret: "s".repeat(32),
  expireMinutes: 30,
  issuer: "bio-ems",
  audience: "bio-ems-api",
};

describe("JWT access-token service", () => {
  it("issues an HS256 token with only the approved claims", () => {
    const issued = serviceFor(configuration).issueAccessToken(7);
    const complete = jwt.decode(issued.accessToken, { complete: true });
    const payload = complete?.payload as JwtPayload;

    expect(complete?.header.alg).toBe("HS256");
    expect(Object.keys(payload).sort()).toEqual(["aud", "exp", "iss", "sub"]);
    expect(payload).toMatchObject({ sub: "7", iss: "bio-ems", aud: "bio-ems-api" });
    expect(payload.iat).toBeUndefined();
    expect(issued.expiresIn).toBe(1800);
    expect(() =>
      jwt.verify(issued.accessToken, signingKey(configuration, 7), {
        algorithms: ["HS256"],
        audience: configuration.audience,
        issuer: configuration.issuer,
      })
    ).not.toThrow();
  });

  it("applies the configured expiry to the claim and response value", () => {
    const issued = serviceFor({ ...configuration, expireMinutes: 45 }).issueAccessToken(3);
    const payload = jwt.decode(issued.accessToken) as JwtPayload;

    expect(issued.expiresIn).toBe(2700);
    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 2690);
  });

  it("verifies an approved HS256 token and returns its canonical User ID", () => {
    const service = serviceFor(configuration);
    const issued = service.issueAccessToken(7);

    expect(service.verifyAccessToken(issued.accessToken)).toBe(7);
  });

  it.each([
    ["invalid signature", () => signedToken({ sub: "7" }, { secret: "x".repeat(32) })],
    ["expired token", () => signedToken({ sub: "7" }, { expiresIn: -1 })],
    ["wrong issuer", () => signedToken({ sub: "7" }, { issuer: "other" })],
    ["wrong audience", () => signedToken({ sub: "7" }, { audience: "other" })],
    ["missing issuer", () => signedToken({ sub: "7" }, { issuer: undefined })],
    ["missing audience", () => signedToken({ sub: "7" }, { audience: undefined })],
    ["missing expiry", () => signedToken({ sub: "7" }, { expiresIn: undefined })],
    ["missing subject", () => signedToken({})],
    ["malformed token", () => "not-a-jwt"],
  ])("rejects %s", (_case, createToken) => {
    expect(() => serviceFor(configuration).verifyAccessToken(createToken())).toThrow();
  });

  it.each(["", "0", "-1", "+1", "01", "1.0", "1e3", " 1 ", "9007199254740992"])(
    "rejects the non-canonical subject %j",
    (sub) => {
      expect(() => serviceFor(configuration).verifyAccessToken(signedToken({ sub }))).toThrow();
    }
  );

  it("rejects a numeric subject and a non-object payload", () => {
    const numericSubject = signedToken({ sub: 7 });
    const stringPayload = jwt.sign("payload", configuration.secret, { algorithm: "HS256" });

    expect(() => serviceFor(configuration).verifyAccessToken(numericSubject)).toThrow();
    expect(() => serviceFor(configuration).verifyAccessToken(stringPayload)).toThrow();
  });

  it("rejects HS384, RS256, and none instead of selecting an algorithm dynamically", () => {
    const hs384 = jwt.sign({ sub: "7" }, configuration.secret, {
      algorithm: "HS384",
      audience: configuration.audience,
      expiresIn: 1800,
      issuer: configuration.issuer,
    });
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const rs256 = jwt.sign({ sub: "7" }, privateKey, {
      algorithm: "RS256",
      audience: configuration.audience,
      expiresIn: 1800,
      issuer: configuration.issuer,
    });
    const none = jwt.sign({ sub: "7" }, "", {
      algorithm: "none",
      audience: configuration.audience,
      expiresIn: 1800,
      issuer: configuration.issuer,
    });

    const service = serviceFor(configuration);
    expect(() => service.verifyAccessToken(hs384)).toThrow();
    expect(() => service.verifyAccessToken(rs256)).toThrow();
    expect(() => service.verifyAccessToken(none)).toThrow();
  });

  it("honors configured issuer and audience overrides during verification", () => {
    const overridden = { ...configuration, issuer: "installation", audience: "installation-api" };
    const service = serviceFor(overridden);
    const issued = service.issueAccessToken(9);

    expect(service.verifyAccessToken(issued.accessToken)).toBe(9);
    expect(() => serviceFor(configuration).verifyAccessToken(issued.accessToken)).toThrow();
  });
  it("rejects legacy globally signed tokens and principals without current credentials", () => {
    const legacy = jwt.sign({}, configuration.secret, {
      algorithm: "HS256",
      subject: "7",
      audience: configuration.audience,
      issuer: configuration.issuer,
      expiresIn: 1800,
    });
    expect(() => serviceFor(configuration).verifyAccessToken(legacy)).toThrow();
    const absent = new TokenService(configuration, { findAccessTokenCredential: () => undefined });
    expect(() => absent.issueAccessToken(7)).toThrow();
  });
});

function signedToken(
  payload: Record<string, unknown>,
  overrides: {
    audience?: string;
    expiresIn?: number;
    issuer?: string;
    secret?: string;
  } = {}
): string {
  const options: jwt.SignOptions = {
    algorithm: "HS256",
    noTimestamp: true,
  };

  const audience = "audience" in overrides ? overrides.audience : configuration.audience;
  const expiresIn = "expiresIn" in overrides ? overrides.expiresIn : 1800;
  const issuer = "issuer" in overrides ? overrides.issuer : configuration.issuer;
  if (audience !== undefined) options.audience = audience;
  if (expiresIn !== undefined) options.expiresIn = expiresIn;
  if (issuer !== undefined) options.issuer = issuer;

  return jwt.sign(
    payload,
    overrides.secret ?? signingKey(configuration, Number(payload.sub)),
    options
  );
}

const fixtureHash = "$2b$12$" + "A".repeat(53);
function serviceFor(configuration: JwtConfig) {
  return new TokenService(configuration, {
    findAccessTokenCredential: () => ({ passwordHash: fixtureHash, status: "active" }),
  });
}
function signingKey(configuration: JwtConfig, userId: number) {
  return createHmac("sha256", configuration.secret)
    .update(JSON.stringify(["bioems-customer-access-v2", userId, fixtureHash]))
    .digest();
}
