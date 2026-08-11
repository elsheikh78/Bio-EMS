import Database from "better-sqlite3";
import { AppError } from "../errors/app-error";
import { User } from "../entities/User";
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPasswordInput,
  UpdateUserStatusInput,
} from "../modules/user/dto/user.schema";
import { LastActiveAdminError, UserRepository } from "../repositories/user.repository";
import { hashPassword, PasswordPolicyError } from "./password.service";

const notFound = () => new AppError("User not found", 404, "USER_NOT_FOUND");
const selfRoleChange = () =>
  new AppError("Administrators cannot change their own role", 409, "SELF_ROLE_CHANGE_FORBIDDEN");
const selfDisable = () =>
  new AppError("Administrators cannot disable themselves", 409, "SELF_DISABLE_FORBIDDEN");
const lastAdmin = () =>
  new AppError("Last active administrator must be preserved", 409, "LAST_ACTIVE_ADMIN_REQUIRED");

export class UserService {
  constructor(private readonly repository: UserRepository = new UserRepository()) {}

  listUsers(): User[] {
    return this.repository.getAll();
  }

  async createUser(input: CreateUserInput): Promise<User> {
    try {
      const passwordHash = await hashPassword(input.password);
      const id = this.repository.create({
        username: input.username,
        email: input.email,
        passwordHash,
        role: input.role,
      });
      return this.repository.findById(id)!;
    } catch (error) {
      if (error instanceof PasswordPolicyError) {
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      }
      if (error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new AppError("Resource already exists", 409, "RESOURCE_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  updateUser(actorId: number, userId: number, input: UpdateUserInput): User {
    if (actorId === userId && input.role !== undefined) throw selfRoleChange();
    try {
      return (
        this.repository.updateProfileAndRole(userId, input) ??
        (() => {
          throw notFound();
        })()
      );
    } catch (error) {
      if (error instanceof LastActiveAdminError) throw lastAdmin();
      throw error;
    }
  }

  updateStatus(actorId: number, userId: number, input: UpdateUserStatusInput): User {
    if (actorId === userId && input.status === "disabled") throw selfDisable();
    try {
      return (
        this.repository.updateStatus(userId, input.status) ??
        (() => {
          throw notFound();
        })()
      );
    } catch (error) {
      if (error instanceof LastActiveAdminError) throw lastAdmin();
      throw error;
    }
  }

  async updatePassword(userId: number, input: UpdateUserPasswordInput): Promise<User> {
    try {
      const passwordHash = await hashPassword(input.password);
      return (
        this.repository.updatePasswordHash(userId, passwordHash) ??
        (() => {
          throw notFound();
        })()
      );
    } catch (error) {
      if (error instanceof PasswordPolicyError) {
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      }
      throw error;
    }
  }
}

export const userService = new UserService();
