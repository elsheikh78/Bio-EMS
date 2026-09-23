import { decryptMfaSecret, encryptMfaSecret } from "./owner-mfa-crypto.service";
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from "./totp.service";

export interface OwnerMfaState {
  username: string;
  mfa_secret_encrypted?: string | null;
  mfa_enabled_at?: string | null;
}

export interface OwnerMfaRepository {
  findMfaState(id: string): OwnerMfaState | undefined;
  beginMfaEnrollment(id: string, encryptedSecret: string, now?: Date): boolean;
  enableMfa(id: string, now?: Date): boolean;
}

export interface OwnerMfaEnrollment {
  secret: string;
  otpauthUri: string;
}

export class OwnerMfaService {
  constructor(
    private readonly repository: OwnerMfaRepository,
    private readonly encryptionKey: Buffer,
    private readonly now: () => Date = () => new Date(),
    private readonly generateSecret: () => string = generateTotpSecret
  ) {}

  beginEnrollment(principalId: string): OwnerMfaEnrollment {
    const state = this.repository.findMfaState(principalId);
    if (!state || state.mfa_enabled_at) {
      throw new Error("MFA enrollment is unavailable");
    }

    if (state.mfa_secret_encrypted) {
      const secret = decryptMfaSecret(state.mfa_secret_encrypted, this.encryptionKey);
      return {
        secret,
        otpauthUri: buildTotpUri(secret, state.username),
      };
    }

    const secret = this.generateSecret();
    const encrypted = encryptMfaSecret(secret, this.encryptionKey);
    if (!this.repository.beginMfaEnrollment(principalId, encrypted, this.now())) {
      throw new Error("MFA enrollment is unavailable");
    }
    return {
      secret,
      otpauthUri: buildTotpUri(secret, state.username),
    };
  }

  confirmEnrollment(principalId: string, code: string): void {
    const state = this.repository.findMfaState(principalId);
    if (!state?.mfa_secret_encrypted || state.mfa_enabled_at) {
      throw new Error("MFA enrollment is unavailable");
    }
    const secret = decryptMfaSecret(state.mfa_secret_encrypted, this.encryptionKey);
    const now = this.now();
    if (!verifyTotpCode(secret, code, now)) {
      throw new Error("Invalid MFA verification code");
    }
    if (!this.repository.enableMfa(principalId, now)) {
      throw new Error("MFA enrollment is unavailable");
    }
  }

  verifyLoginCode(state: OwnerMfaState, code: string): boolean {
    if (!state.mfa_secret_encrypted || !state.mfa_enabled_at) return false;
    const secret = decryptMfaSecret(state.mfa_secret_encrypted, this.encryptionKey);
    return verifyTotpCode(secret, code, this.now());
  }
}
