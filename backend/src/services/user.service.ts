import Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import { AppError } from "../errors/app-error";
import { AuditActorSnapshot, AuditEventInput, AuditRequestContext } from "../entities/AuditEvent";
import { User } from "../entities/User";
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPasswordInput,
  UpdateUserStatusInput,
} from "../modules/user/dto/user.schema";
import {
  publicUserAuditValues,
  USER_AUDIT_ACTION,
  UserAuditAction,
} from "../modules/user/user-audit";
import { LastActiveAdminError, UserRepository } from "../repositories/user.repository";
import { auditEventService, AuditEventService } from "./audit-event.service";
import { hashPassword, PasswordPolicyError } from "./password.service";

const notFound = () => new AppError("User not found", 404, "USER_NOT_FOUND");
const selfRoleChange = () =>
  new AppError("Administrators cannot change their own role", 409, "SELF_ROLE_CHANGE_FORBIDDEN");
const selfDisable = () =>
  new AppError("Administrators cannot disable themselves", 409, "SELF_DISABLE_FORBIDDEN");
const lastAdmin = () =>
  new AppError("Last active administrator must be preserved", 409, "LAST_ACTIVE_ADMIN_REQUIRED");
const adminManagedBySystemOwner = () =>
  new AppError(
    "Administrator accounts are managed by SYSTEM_OWNER",
    403,
    "ADMIN_MANAGED_BY_SYSTEM_OWNER"
  );

export interface UserServiceDependencies {
  repository: UserRepository;
  auditService: Pick<AuditEventService, "record">;
  runInTransaction: <T>(operation: () => T) => T;
}

export class UserService {
  private readonly repository: UserRepository;
  private readonly auditService: Pick<AuditEventService, "record">;
  private readonly runInTransaction: <T>(operation: () => T) => T;

  constructor(dependencies: Partial<UserServiceDependencies> = {}) {
    this.repository = dependencies.repository ?? new UserRepository();
    this.auditService = dependencies.auditService ?? auditEventService;
    this.runInTransaction =
      dependencies.runInTransaction ?? ((operation) => sqlite.transaction(operation)());
  }

  listUsers(actorId?: number): User[] {
    return this.repository.getAll().filter((user) => user.role !== "ADMIN" || user.id === actorId);
  }

  async createUser(
    actor: AuditActorSnapshot,
    input: CreateUserInput,
    requestContext: AuditRequestContext
  ): Promise<User> {
    if (input.role === "ADMIN") throw adminManagedBySystemOwner();
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(input.password);
    } catch (error) {
      if (error instanceof PasswordPolicyError) {
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      }
      throw error;
    }

    return this.executeMutation(actor, USER_AUDIT_ACTION.CREATED, undefined, requestContext, () => {
      const id = this.repository.create({
        username: input.username,
        email: input.email,
        passwordHash,
        role: input.role,
      });
      const created = this.repository.findById(id)!;
      this.recordSuccess({
        actor,
        action: USER_AUDIT_ACTION.CREATED,
        target: { type: "USER", id: String(created.id) },
        result: "SUCCESS",
        newValues: publicUserAuditValues(created),
        requestContext,
      });
      return created;
    });
  }

  updateUser(
    actor: AuditActorSnapshot,
    userId: number,
    input: UpdateUserInput,
    requestContext: AuditRequestContext
  ): User {
    return this.executeMutation(
      actor,
      USER_AUDIT_ACTION.PROFILE_UPDATED,
      userId,
      requestContext,
      () => {
        const previous = this.repository.findById(userId);
        if (!previous) throw notFound();
        if (previous.role === "ADMIN" || input.role === "ADMIN") throw adminManagedBySystemOwner();
        if (Number(actor.id) === userId && input.role !== undefined) throw selfRoleChange();
        const updated = this.repository.updateProfileAndRole(userId, input);
        if (!updated) throw notFound();
        this.recordSuccess({
          actor,
          action: USER_AUDIT_ACTION.PROFILE_UPDATED,
          target: { type: "USER", id: String(userId) },
          result: "SUCCESS",
          previousValues: { email: previous.email, role: previous.role },
          newValues: { email: updated.email, role: updated.role },
          requestContext,
        });
        return updated;
      }
    );
  }

  updateStatus(
    actor: AuditActorSnapshot,
    userId: number,
    input: UpdateUserStatusInput,
    requestContext: AuditRequestContext
  ): User {
    return this.executeMutation(
      actor,
      USER_AUDIT_ACTION.STATUS_UPDATED,
      userId,
      requestContext,
      () => {
        if (Number(actor.id) === userId && input.status === "disabled") throw selfDisable();
        const previous = this.repository.findById(userId);
        if (!previous) throw notFound();
        if (previous.role === "ADMIN") throw adminManagedBySystemOwner();
        const updated = this.repository.updateStatus(userId, input.status);
        if (!updated) throw notFound();
        this.recordSuccess({
          actor,
          action: USER_AUDIT_ACTION.STATUS_UPDATED,
          target: { type: "USER", id: String(userId) },
          result: "SUCCESS",
          previousValues: { status: previous.status },
          newValues: { status: updated.status },
          requestContext,
        });
        return updated;
      }
    );
  }

  async updatePassword(
    actor: AuditActorSnapshot,
    userId: number,
    input: UpdateUserPasswordInput,
    requestContext: AuditRequestContext
  ): Promise<User> {
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(input.password);
    } catch (error) {
      if (error instanceof PasswordPolicyError) {
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      }
      throw error;
    }

    return this.executeMutation(
      actor,
      USER_AUDIT_ACTION.PASSWORD_UPDATED,
      userId,
      requestContext,
      () => {
        const previous = this.repository.findById(userId);
        if (!previous) throw notFound();
        if (previous.role === "ADMIN") throw adminManagedBySystemOwner();
        const updated = this.repository.updatePasswordHash(userId, passwordHash);
        if (!updated) throw notFound();
        this.recordSuccess({
          actor,
          action: USER_AUDIT_ACTION.PASSWORD_UPDATED,
          target: { type: "USER", id: String(userId) },
          result: "SUCCESS",
          requestContext,
        });
        return updated;
      }
    );
  }

  private executeMutation<T>(
    actor: AuditActorSnapshot,
    action: UserAuditAction,
    targetId: number | undefined,
    requestContext: AuditRequestContext,
    operation: () => T
  ): T {
    try {
      return this.runInTransaction(operation);
    } catch (error) {
      const mappedError = mapUserManagementError(error);
      this.recordFailure(actor, action, targetId, requestContext, mappedError);
      throw mappedError;
    }
  }

  private recordSuccess(event: AuditEventInput): void {
    this.auditService.record(event);
  }

  private recordFailure(
    actor: AuditActorSnapshot,
    action: UserAuditAction,
    targetId: number | undefined,
    requestContext: AuditRequestContext,
    error: unknown
  ): void {
    const reason = error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR";
    try {
      this.auditService.record({
        actor,
        action,
        target: targetId === undefined ? undefined : { type: "USER", id: String(targetId) },
        result: "FAILED",
        requestContext,
        reason,
      });
    } catch {
      // Preserve the original mutation failure when best-effort failure evidence cannot persist.
    }
  }
}

function mapUserManagementError(error: unknown): unknown {
  if (error instanceof LastActiveAdminError) return lastAdmin();
  if (error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return new AppError("Resource already exists", 409, "RESOURCE_ALREADY_EXISTS");
  }
  return error;
}

export const userService = new UserService();
