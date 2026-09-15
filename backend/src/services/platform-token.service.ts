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

export interface IssuedOwnerSupportToken {
  supportToken: string;
  expiresIn: number;
}

export interface VerifiedOwnerSupportToken {
  principalId: string;
  principalType: "SYSTEM_OWNER";
  grantId: string;
  siteId: number | null;
}

export class PlatformTokenService {
  constructor(private readonly configuration: PlatformJwtConfig) {}

  issueAccessToken(principal: PlatformPrincipal, sessionId?: string): IssuedPlatformAccessToken {
    const expiresIn = this.configuration.expireMinutes * 60;
    const accessToken = this.sign(principal, "ACCESS", expiresIn, {
      ...(sessionId ? { session_id: sessionId } : {}),
    });
    return { accessToken, expiresIn };
  }

  issueMfaEnrollmentToken(principal: PlatformPrincipal): IssuedOwnerMfaEnrollmentToken {
    const expiresIn = 5 * 60;
    const enrollmentToken = this.sign(principal, "MFA_ENROLLMENT", expiresIn);
    return { enrollmentToken, expiresIn };
  }

  issueSupportToken(
    principal: PlatformPrincipal,
    grantId: string,
    siteId: number | null,
    expiresIn: number
  ): IssuedOwnerSupportToken {
    if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 8 * 60 * 60) {
      throw new Error("Invalid owner support token lifetime");
    }
    const supportToken = this.sign(principal, "OWNER_SUPPORT", expiresIn, {
      grant_id: grantId,
      site_id: siteId,
    });
    return { supportToken, expiresIn };
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

  verifySupportToken(token: string): VerifiedOwnerSupportToken {
    const payload = this.verify(token);
    if (
      payload.token_purpose !== "OWNER_SUPPORT" ||
      typeof payload.grant_id !== "string" ||
      payload.grant_id.length === 0 ||
      (payload.site_id !== null &&
        (typeof payload.site_id !== "number" ||
          !Number.isInteger(payload.site_id) ||
          payload.site_id < 1))
    ) {
      throw new Error("Invalid owner support token claims");
    }
    return {
      principalId: payload.sub,
      principalType: payload.principal_type,
      grantId: payload.grant_id,
      siteId: payload.site_id,
    };
  }

  private sign(
    principal: PlatformPrincipal,
    purpose: ValidPlatformTokenPayload["token_purpose"],
    expiresIn: number,
    claims: Record<string, unknown> = {}
  ): string {
    return jwt.sign(
      {
        principal_kind: "platform",
        principal_type: principal.type,
        token_purpose: purpose,
        ...claims,
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
  token_purpose: "ACCESS" | "MFA_ENROLLMENT" | "OWNER_SUPPORT";
  session_id?: string;
  grant_id?: string;
  site_id?: number | null;
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
    (payload.token_purpose === "ACCESS" ||
      payload.token_purpose === "MFA_ENROLLMENT" ||
      payload.token_purpose === "OWNER_SUPPORT") &&
    (payload.session_id === undefined ||
      (typeof payload.session_id === "string" && payload.session_id.length > 0))
  );
}
