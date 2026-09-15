import { randomUUID } from "node:crypto";
import { AppError } from "../errors/app-error";
import {
  PlatformPrincipal,
  PlatformPrincipalCredentialRecord,
} from "../entities/PlatformPrincipal";
import { PlatformLoginInput } from "../modules/platform-auth/dto/platform-login.schema";
import { verifyPassword } from "./password.service";
import {
  IssuedOwnerMfaEnrollmentToken,
  IssuedPlatformAccessToken,
} from "./platform-token.service";

const DUMMY_BCRYPT_HASH = "$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK";

export interface PlatformAuthRepository {
  findCredentialsByUsername(username: string): PlatformPrincipalCredentialRecord | undefined;
  recordFailedLogin?(id: string, now?: Date): void;
  clearFailedLogins?(id: string, now?: Date): void;
}

export interface PlatformAccessTokenIssuer {
  issueAccessToken(principal: PlatformPrincipal, sessionId?: string): IssuedPlatformAccessToken;
  issueMfaEnrollmentToken(principal: PlatformPrincipal): IssuedOwnerMfaEnrollmentToken;
}

export interface PlatformLoginMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface PlatformSessionWriter {
  create(
    principalId: string,
    accessToken: string,
    expiresAt: Date,
    metadata: PlatformLoginMetadata,
    sessionId: string
  ): { id: string };
}

export interface PlatformMfaVerifier {
  verifyLoginCode(state: PlatformPrincipalCredentialRecord, code: string): boolean;
}

export interface PlatformAuthenticatedResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  principal: PlatformPrincipal;
}

export interface PlatformMfaEnrollmentRequiredResponse {
  mfa_enrollment_required: true;
  enrollment_token: string;
  token_type: "bearer";
  expires_in: number;
}

export type PlatformLoginResponse =
  | PlatformAuthenticatedResponse
  | PlatformMfaEnrollmentRequiredResponse;

const invalidCredentials = () => new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

export class PlatformAuthService {
  constructor(
    private readonly repository: PlatformAuthRepository,
    private readonly tokenIssuer: PlatformAccessTokenIssuer,
    private readonly now: () => Date = () => new Date(),
    private readonly sessions?: PlatformSessionWriter,
    private readonly mfa?: PlatformMfaVerifier
  ) {}

  async login(
    input: PlatformLoginInput,
    metadata: PlatformLoginMetadata = {}
  ): Promise<PlatformLoginResponse> {
    const credentials = this.repository.findCredentialsByUsername(input.username);
    const now = this.now();
    const passwordMatches = await verifyPassword(
      input.password,
      credentials?.password_hash ?? DUMMY_BCRYPT_HASH
    );

    const locked =
      credentials?.locked_until !== undefined &&
      credentials.locked_until !== null &&
      new Date(credentials.locked_until).getTime() > now.getTime();

    if (
      !credentials ||
      !passwordMatches ||
      credentials.status !== "active" ||
      credentials.principal_type !== "SYSTEM_OWNER" ||
      locked
    ) {
      if (credentials && !locked) this.repository.recordFailedLogin?.(credentials.id, now);
      throw invalidCredentials();
    }

    const principal: PlatformPrincipal = {
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: credentials.id,
      username: credentials.username,
    };

    if (!credentials.mfa_enabled_at) {
      this.repository.clearFailedLogins?.(credentials.id, now);
      const issued = this.tokenIssuer.issueMfaEnrollmentToken(principal);
      return {
        mfa_enrollment_required: true,
        enrollment_token: issued.enrollmentToken,
        token_type: "bearer",
        expires_in: issued.expiresIn,
      };
    }

    const verified = (() => {
      try {
        return Boolean(input.code && this.mfa?.verifyLoginCode(credentials, input.code));
      } catch {
        return false;
      }
    })();
    if (!verified) {
      this.repository.recordFailedLogin?.(credentials.id, now);
      throw new AppError("MFA verification required", 401, "OWNER_MFA_REQUIRED");
    }

    this.repository.clearFailedLogins?.(credentials.id, now);

    const sessionId = randomUUID();
    const issued = this.tokenIssuer.issueAccessToken(principal, sessionId);
    if (this.sessions) {
      this.sessions.create(
        principal.id,
        issued.accessToken,
        new Date(now.getTime() + issued.expiresIn * 1000),
        metadata,
        sessionId
      );
    }

    return {
      access_token: issued.accessToken,
      token_type: "bearer",
      expires_in: issued.expiresIn,
      principal,
    };
  }
}
