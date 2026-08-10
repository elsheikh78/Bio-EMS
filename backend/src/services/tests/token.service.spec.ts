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
    const issued = new TokenService(configuration).issueAccessToken(7);
    const complete = jwt.decode(issued.accessToken, { complete: true });
    const payload = complete?.payload as JwtPayload;

    expect(complete?.header.alg).toBe("HS256");
    expect(Object.keys(payload).sort()).toEqual(["aud", "exp", "iss", "sub"]);
    expect(payload).toMatchObject({ sub: "7", iss: "bio-ems", aud: "bio-ems-api" });
    expect(payload.iat).toBeUndefined();
    expect(issued.expiresIn).toBe(1800);
    expect(() =>
      jwt.verify(issued.accessToken, configuration.secret, {
        algorithms: ["HS256"],
        audience: configuration.audience,
        issuer: configuration.issuer,
      })
    ).not.toThrow();
  });

  it("applies the configured expiry to the claim and response value", () => {
    const issued = new TokenService({ ...configuration, expireMinutes: 45 }).issueAccessToken(3);
    const payload = jwt.decode(issued.accessToken) as JwtPayload;

    expect(issued.expiresIn).toBe(2700);
    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 2690);
  });
});
