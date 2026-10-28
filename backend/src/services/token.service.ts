import { createHmac } from "node:crypto";
import { UserRepository } from "../repositories/user.repository";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JwtConfig } from "../config/jwt.config";

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

export class TokenService {
  constructor(
    private readonly configuration: JwtConfig,
    private readonly credentials: Pick<
      UserRepository,
      "findAccessTokenCredential"
    > = new UserRepository()
  ) {}

  private signingKey(userId: number, expectedPasswordHash?: string): Buffer {
    const credential = this.credentials.findAccessTokenCredential(userId);
    if (
      !credential ||
      credential.status !== "active" ||
      !credential.passwordHash ||
      (expectedPasswordHash !== undefined && credential.passwordHash !== expectedPasswordHash)
    )
      throw new Error("Access token principal is unavailable");
    // Domain separation; neither the stored hash nor its derivative is a public JWT claim.
    return createHmac("sha256", this.configuration.secret)
      .update(JSON.stringify(["bioems-customer-access-v2", userId, credential.passwordHash]))
      .digest();
  }

  issueAccessToken(userId: number, expectedPasswordHash?: string): IssuedAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = jwt.sign({}, this.signingKey(userId, expectedPasswordHash), {
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
    // Decode only to select a key. No decoded claim is trusted until jwt.verify succeeds.
    const untrusted = jwt.decode(token);
    if (!isValidAccessTokenPayload(untrusted)) throw new Error("Invalid access token claims");
    const userId = Number(untrusted.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0)
      throw new Error("Invalid access token subject");
    const payload = jwt.verify(token, this.signingKey(userId), {
      algorithms: ["HS256"],
      audience: this.configuration.audience,
      issuer: this.configuration.issuer,
    });

    if (!isValidAccessTokenPayload(payload)) {
      throw new Error("Invalid access token claims");
    }

    const verifiedUserId = Number(payload.sub);
    if (!Number.isSafeInteger(verifiedUserId) || verifiedUserId <= 0) {
      throw new Error("Invalid access token subject");
    }

    return verifiedUserId;
  }
}

function isValidAccessTokenPayload(payload: string | JwtPayload | null): payload is JwtPayload & {
  exp: number;
  sub: string;
} {
  return (
    payload !== null &&
    typeof payload !== "string" &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp) &&
    typeof payload.sub === "string" &&
    /^[1-9]\d*$/.test(payload.sub)
  );
}
