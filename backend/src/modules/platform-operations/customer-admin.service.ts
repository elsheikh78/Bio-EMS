import Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";
import type { UserStatus } from "../../entities/User";
import { CustomerOwnershipRepository } from "../customer-ownership/customer-ownership.repository";
import { UserRepository } from "../../repositories/user.repository";
import { hashPassword, PasswordPolicyError } from "../../services/password.service";

interface AdminInput {
  username: string;
  email?: string | null;
  password: string;
}

export class CustomerAdminService {
  private readonly users: UserRepository;
  private readonly ownership: CustomerOwnershipRepository;

  constructor(private readonly database: Database.Database = sqlite) {
    this.users = new UserRepository(database);
    this.ownership = new CustomerOwnershipRepository(database);
  }

  list(customerId: number) {
    this.assertCustomer(customerId);
    return this.database
      .prepare(
        `SELECT u.id,u.username,u.email,u.role,u.status,u.created_at,u.updated_at
         FROM customer_user_bindings b JOIN users u ON u.id = b.user_id
         WHERE b.customer_id = ? AND u.role = 'ADMIN' ORDER BY u.id`
      )
      .all(customerId);
  }

  async create(customerId: number, input: AdminInput, actor: string) {
    this.assertCustomer(customerId);
    const passwordHash = await this.safeHash(input.password);
    return this.database.transaction(() => {
      const id = this.users.create({
        username: input.username,
        email: input.email,
        passwordHash,
        role: "ADMIN",
      });
      this.ownership.bindUser(customerId, id, actor);
      this.record("CUSTOMER_ADMIN_CREATED", id, customerId, actor, {
        username: input.username.trim().toLowerCase(),
        email: input.email ?? null,
        status: "active",
      });
      return this.users.findById(id)!;
    })();
  }

  updateStatus(customerId: number, userId: number, status: UserStatus, actor: string) {
    return this.database.transaction(() => {
      const current = this.assertAdmin(customerId, userId);
      if (current.status === "active" && status === "disabled") {
        const active = this.database
          .prepare(
            `SELECT COUNT(*) AS count FROM customer_user_bindings b
             JOIN users u ON u.id = b.user_id
             WHERE b.customer_id = ? AND u.role = 'ADMIN' AND u.status = 'active' AND u.id <> ?`
          )
          .get(customerId, userId) as { count: number };
        if (active.count === 0)
          throw new AppError(
            "Customer must retain an active administrator",
            409,
            "LAST_ACTIVE_CUSTOMER_ADMIN_REQUIRED"
          );
      }
      const updated = this.users.updateStatus(userId, status);
      if (!updated) throw notFound();
      this.record("CUSTOMER_ADMIN_STATUS_UPDATED", userId, customerId, actor, { status });
      return updated;
    })();
  }

  async updatePassword(customerId: number, userId: number, password: string, actor: string) {
    this.assertAdmin(customerId, userId);
    const passwordHash = await this.safeHash(password);
    return this.database.transaction(() => {
      this.assertAdmin(customerId, userId);
      const updated = this.users.updatePasswordHash(userId, passwordHash);
      if (!updated) throw notFound();
      this.record("CUSTOMER_ADMIN_PASSWORD_UPDATED", userId, customerId, actor, {
        credentialChanged: true,
      });
      return updated;
    })();
  }

  private assertCustomer(customerId: number): void {
    const customer = this.database
      .prepare("SELECT status FROM platform_customers WHERE id = ?")
      .get(customerId) as { status: string } | undefined;
    if (!customer) throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    if (customer.status === "CLOSED")
      throw new AppError("Customer is closed", 409, "CUSTOMER_CLOSED");
  }

  private assertAdmin(customerId: number, userId: number): { status: UserStatus } {
    const row = this.database
      .prepare(
        `SELECT u.status FROM customer_user_bindings b JOIN users u ON u.id = b.user_id
         WHERE b.customer_id = ? AND b.user_id = ? AND u.role = 'ADMIN'`
      )
      .get(customerId, userId) as { status: UserStatus } | undefined;
    if (!row) throw notFound();
    return row;
  }

  private async safeHash(password: string): Promise<string> {
    try {
      return await hashPassword(password);
    } catch (error) {
      if (error instanceof PasswordPolicyError)
        throw new AppError(error.message, 400, "VALIDATION_ERROR");
      throw error;
    }
  }

  private record(
    eventType: string,
    userId: number,
    customerId: number,
    actor: string,
    snapshot: object
  ) {
    this.database
      .prepare(
        `INSERT INTO platform_commercial_events
         (event_type,entity_type,entity_id,occurred_at,actor_identity,snapshot_json)
         VALUES (?,'CUSTOMER_ADMIN',?,?,?,?)`
      )
      .run(
        eventType,
        userId,
        new Date().toISOString(),
        actor,
        JSON.stringify({ customerId, ...snapshot })
      );
  }
}

const notFound = () =>
  new AppError("Customer administrator not found", 404, "CUSTOMER_ADMIN_NOT_FOUND");

export const customerAdminService = new CustomerAdminService();
