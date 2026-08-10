import jwt, { JwtPayload } from "jsonwebtoken";
import { JwtConfig } from "../config/jwt.config";

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

export class TokenService {
  constructor(private readonly configuration: JwtConfig) {}

  issueAccessToken(userId: number): IssuedAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = jwt.sign({}, this.configuration.secret, {
      algorithm: "HS256",
      audience: this.configuration.audience,
      expiresIn,
      issuer: this.configuration.issuer,
      noTimestamp: true,
      subject: String(userId),
    });

    return { accessToken, expiresIn };
  }

  verifyAccessToken(token: string): number {
    const payload = jwt.verify(token, this.configuration.secret, {
      algorithms: ["HS256"],
      audience: this.configuration.audience,
      issuer: this.configuration.issuer,
    });

    if (!isValidAccessTokenPayload(payload)) {
      throw new Error("Invalid access token claims");
    }

    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error("Invalid access token subject");
    }

    return userId;
  }
}

function isValidAccessTokenPayload(payload: string | JwtPayload): payload is JwtPayload & {
  exp: number;
  sub: string;
} {
  return (
    typeof payload !== "string" &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp) &&
    typeof payload.sub === "string" &&
    /^[1-9]\d*$/.test(payload.sub)
  );
}
