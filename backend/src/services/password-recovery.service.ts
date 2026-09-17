import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { normalizeUsername } from "../entities/User";
import {
  PasswordRecoveryRepository,
  PasswordRecoveryRequest,
} from "../repositories/password-recovery.repository";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, PasswordPolicyError, verifyPassword } from "./password.service";

const GENERIC_FORGOT_RESPONSE = {
  accepted: true,
  message: "If the account is eligible, a password recovery request has been recorded.",
};

type SafePasswordRecoveryRequest = Omit<PasswordRecoveryRequest, "challenge_hash">;

export class PasswordRecoveryService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly recovery = new PasswordRecoveryRepository()
  ) {}

  requestCustomerRecovery(username: string): typeof GENERIC_FORGOT_RESPONSE {
    const normalized = normalizeUsername(username);
    const user = this.users.findByUsername(normalized);

    if (user?.status === "active" && user.role !== "ADMIN") {
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

  listPendingCustomerRecoveryRequests(): SafePasswordRecoveryRequest[] {
    return this.recovery
      .listPendingUserRequests()
      .map(({ challenge_hash: _challengeHash, ...request }) => request);
  }

  async resetCustomerPasswordFromRecoveryRequest(
    requestId: string,
    password: string,
    adminId: number
  ): Promise<{ request_id: string; principal_id: number; status: "CONSUMED" }> {
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      if (error instanceof PasswordPolicyError)
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      throw error;
    }

    return sqlite.transaction(() => {
      const request = this.recovery.findPendingUserRequest(requestId);
      if (!request || request.principal_id === null) {
        throw new AppError(
          "Password recovery request not found",
          404,
          "PASSWORD_RECOVERY_REQUEST_NOT_FOUND"
        );
      }

      const user = this.users.findById(request.principal_id);
      if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      if (user.role === "ADMIN") {
        throw new AppError(
          "Administrator accounts are managed by SYSTEM_OWNER",
          403,
          "ADMIN_MANAGED_BY_SYSTEM_OWNER"
        );
      }
      if (user.status !== "active") {
        throw new AppError("User account is not active", 409, "USER_NOT_ACTIVE");
      }

      const updated = this.users.updatePasswordHash(user.id, passwordHash, true);
      if (!updated) throw new AppError("User not found", 404, "USER_NOT_FOUND");
      if (!this.recovery.consume(requestId)) {
        throw new AppError(
          "Password recovery request is no longer active",
          409,
          "PASSWORD_RECOVERY_REQUEST_INACTIVE"
        );
      }

      this.recovery.recordAudit({
        eventType: "PASSWORD_RECOVERY_CONSUMED",
        requestId,
        principalType: "USER",
        principalId: user.id,
        actorType: "ADMIN",
        actorId: String(adminId),
        outcome: "SUCCESS",
      });

      return { request_id: requestId, principal_id: user.id, status: "CONSUMED" as const };
    })();
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
