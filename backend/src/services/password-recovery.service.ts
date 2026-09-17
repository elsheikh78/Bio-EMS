import { AppError } from "../errors/app-error";
import { normalizeUsername } from "../entities/User";
import { PasswordRecoveryRepository } from "../repositories/password-recovery.repository";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, PasswordPolicyError, verifyPassword } from "./password.service";

const GENERIC_FORGOT_RESPONSE = {
  accepted: true,
  message: "If the account is eligible, a password recovery request has been recorded.",
};

export class PasswordRecoveryService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly recovery = new PasswordRecoveryRepository()
  ) {}

  requestCustomerRecovery(username: string): typeof GENERIC_FORGOT_RESPONSE {
    const normalized = normalizeUsername(username);
    const user = this.users.findByUsername(normalized);

    if (user?.status === "active") {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const requestId = this.recovery.createUserRequest({
        principalId: user.id,
        usernameHint: normalized,
        expiresAt,
      });
      this.recovery.recordAudit({
        eventType: "PASSWORD_RECOVERY_REQUESTED",
        requestId,
        principalType: "USER",
        principalId: user.id,
        actorType: "PUBLIC",
        outcome: "SUCCESS",
      });
    }

    return GENERIC_FORGOT_RESPONSE;
  }

  async changeOwnPassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = this.users.findById(userId);
    if (!user) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const credentials = this.users.findCredentialsByUsername(user.username);
    if (!credentials || !(await verifyPassword(currentPassword, credentials.password_hash))) {
      throw new AppError("Current password is invalid", 401, "INVALID_CURRENT_PASSWORD");
    }

    let passwordHash: string;
    try {
      passwordHash = await hashPassword(newPassword);
    } catch (error) {
      if (error instanceof PasswordPolicyError)
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      throw error;
    }

    this.users.updatePasswordHash(userId, passwordHash, false);
    this.recovery.recordAudit({
      eventType: "PASSWORD_CHANGED",
      principalType: "USER",
      principalId: userId,
      actorType: "USER",
      actorId: String(userId),
      outcome: "SUCCESS",
    });
  }
}

export const passwordRecoveryService = new PasswordRecoveryService();
