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

export interface IssuedOwnerMfaEnrollmentToken {
  enrollmentToken: string;
  expiresIn: number;
}

export class PlatformTokenService {
  constructor(private readonly configuration: PlatformJwtConfig) {}

  issueAccessToken(principal: PlatformPrincipal, sessionId?: string): IssuedPlatformAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = jwt.sign(
      {
        principal_kind: "platform",
        principal_type: principal.type,
        token_purpose: "ACCESS",
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

  issueMfaEnrollmentToken(principal: PlatformPrincipal): IssuedOwnerMfaEnrollmentToken {
    const expiresIn = 5 * 60;
    const enrollmentToken = jwt.sign(
      {
        principal_kind: "platform",
        principal_type: principal.type,
        token_purpose: "MFA_ENROLLMENT",
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
    return { enrollmentToken, expiresIn };
  }

  verifyAccessToken(token: string): VerifiedPlatformAccessToken {
    const payload = this.verify(token);
    if (payload.token_purpose !== "ACCESS") {
      throw new Error("Invalid platform access token purpose");
    }
    return {
      principalId: payload.sub,
      principalType: payload.principal_type,
      sessionId: typeof payload.session_id === "string" ? payload.session_id : undefined,
    };
  }

  verifyMfaEnrollmentToken(token: string): VerifiedPlatformAccessToken {
    const payload = this.verify(token);
    if (payload.token_purpose !== "MFA_ENROLLMENT" || payload.session_id !== undefined) {
      throw new Error("Invalid owner MFA enrollment token purpose");
    }
    return {
      principalId: payload.sub,
      principalType: payload.principal_type,
    };
  }

  private verify(token: string): ValidPlatformTokenPayload {
    const payload = jwt.verify(token, this.configuration.secret, {
      algorithms: ["HS256"],
      audience: this.configuration.audience,
      issuer: this.configuration.issuer,
    });
    if (!isValidPlatformTokenPayload(payload)) {
      throw new Error("Invalid platform token claims");
    }
    return payload;
  }
}

type ValidPlatformTokenPayload = JwtPayload & {
  exp: number;
  sub: string;
  principal_kind: "platform";
  principal_type: "SYSTEM_OWNER";
  token_purpose: "ACCESS" | "MFA_ENROLLMENT";
  session_id?: string;
};

function isValidPlatformTokenPayload(
  payload: string | JwtPayload
): payload is ValidPlatformTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp) &&
    typeof payload.sub === "string" &&
    payload.sub.length > 0 &&
    payload.principal_kind === "platform" &&
    payload.principal_type === "SYSTEM_OWNER" &&
    (payload.token_purpose === "ACCESS" || payload.token_purpose === "MFA_ENROLLMENT") &&
    (payload.session_id === undefined ||
      (typeof payload.session_id === "string" && payload.session_id.length > 0))
  );
}
