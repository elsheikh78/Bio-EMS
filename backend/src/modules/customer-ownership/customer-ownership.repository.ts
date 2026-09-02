import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";

export interface CustomerOwnership {
  customerId: number;
  customerCode: string;
  customerStatus: "ACTIVE" | "SUSPENDED" | "CLOSED";
}

export class CustomerOwnershipRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  forUser(userId: number): CustomerOwnership | undefined {
    return this.database
      .prepare(
        `SELECT c.id AS customerId,c.code AS customerCode,c.status AS customerStatus
         FROM customer_user_bindings b
         JOIN platform_customers c ON c.id = b.customer_id
         WHERE b.user_id = ? LIMIT 1`
      )
      .get(userId) as CustomerOwnership | undefined;
  }

  forSite(siteId: number): CustomerOwnership | undefined {
    return this.database
      .prepare(
        `SELECT c.id AS customerId,c.code AS customerCode,c.status AS customerStatus
         FROM customer_site_bindings b
         JOIN platform_customers c ON c.id = b.customer_id
         WHERE b.site_id = ? LIMIT 1`
      )
      .get(siteId) as CustomerOwnership | undefined;
  }

  bindUser(customerId: number, userId: number, actor: string, at = new Date().toISOString()): void {
    this.database
      .prepare(
        `INSERT INTO customer_user_bindings (customer_id,user_id,bound_at,bound_by)
         VALUES (?,?,?,?)`
      )
      .run(customerId, userId, at, actor);
  }

  bindSite(customerId: number, siteId: number, actor: string, at = new Date().toISOString()): void {
    this.database
      .prepare(
        `INSERT INTO customer_site_bindings (customer_id,site_id,bound_at,bound_by)
         VALUES (?,?,?,?)`
      )
      .run(customerId, siteId, at, actor);
  }

  assertSameCustomer(userId: number, siteId: number): boolean {
    const user = this.forUser(userId);
    const site = this.forSite(siteId);
    return Boolean(user && site && user.customerId === site.customerId);
  }
}
