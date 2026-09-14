import jwt, { JwtPayload } from "jsonwebtoken";
import { PlatformPrincipal } from "../entities/PlatformPrincipal";
import { PlatformJwtConfig } from "../config/platform-jwt.config";

export interface IssuedPlatformAccessToken {
  accessToken: string;
  expiresIn: number;
}

export interface VerifiedPlatformAccessToken {
  principalId: string;
  principalType: "SYSTEM_OWNER";
  sessionId?: string;
}

export class PlatformTokenService {
  constructor(private readonly configuration: PlatformJwtConfig) {}

  issueAccessToken(principal: PlatformPrincipal, sessionId?: string): IssuedPlatformAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = jwt.sign(
      {
        principal_kind: "platform",
        principal_type: principal.type,
        ...(sessionId ? { session_id: sessionId } : {}),
      },
      this.configuration.secret,
      {
        algorithm: "HS256",
        audience: this.configuration.audience,
        expiresIn,
        issuer: this.configuration.issuer,
        noTimestamp: true,
        subject: principal.id,
      }
    );

    return { accessToken, expiresIn };
  }

  verifyAccessToken(token: string): VerifiedPlatformAccessToken {
    const payload = jwt.verify(token, this.configuration.secret, {
      algorithms: ["HS256"],
      audience: this.configuration.audience,
      issuer: this.configuration.issuer,
    });

    if (!isValidPlatformAccessTokenPayload(payload)) {
      throw new Error("Invalid platform access token claims");
    }

    return {
      principalId: payload.sub,
      principalType: payload.principal_type,
      sessionId: typeof payload.session_id === "string" ? payload.session_id : undefined,
    };
  }
}

function isValidPlatformAccessTokenPayload(payload: string | JwtPayload): payload is JwtPayload & {
  exp: number;
  sub: string;
  principal_kind: "platform";
  principal_type: "SYSTEM_OWNER";
  session_id?: string;
} {
  return (
    typeof payload !== "string" &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp) &&
    typeof payload.sub === "string" &&
    payload.sub.length > 0 &&
    payload.principal_kind === "platform" &&
    payload.principal_type === "SYSTEM_OWNER" &&
    (payload.session_id === undefined ||
      (typeof payload.session_id === "string" && payload.session_id.length > 0))
  );
}
