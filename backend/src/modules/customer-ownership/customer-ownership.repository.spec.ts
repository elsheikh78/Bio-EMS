import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTables } from "../../../database/sqlite/schema";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration019 } from "../../../database/sqlite/migrations/019_create_customer_ownership";
import { CustomerOwnershipRepository } from "./customer-ownership.repository";

describe("CustomerOwnershipRepository", () => {
  let database: Database.Database;
  let repository: CustomerOwnershipRepository;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    createTables(database);
    migration018.up(database);
    migration019.up(database);
    repository = new CustomerOwnershipRepository(database);
  });
  afterEach(() => database.close());

  it("binds one User and Site to the same explicit customer", () => {
    const customerId = Number(
      database
        .prepare(
          "INSERT INTO platform_customers (code,name,status,created_at,created_by) VALUES ('BIO','Bio','ACTIVE','2026-09-02T00:00:00.000Z','owner')"
        )
        .run().lastInsertRowid
    );
    const siteId = Number(
      database.prepare("INSERT INTO sites (code,name) VALUES ('S1','Site')").run().lastInsertRowid
    );
    const userId = Number(
      database
        .prepare(
          `INSERT INTO users (username,password_hash,role,status)
           VALUES ('admin','$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK','ADMIN','active')`
        )
        .run().lastInsertRowid
    );

    repository.bindUser(customerId, userId, "owner");
    repository.bindSite(customerId, siteId, "owner");

    expect(repository.forUser(userId)).toEqual({
      customerId,
      customerCode: "BIO",
      customerStatus: "ACTIVE",
    });
    expect(repository.assertSameCustomer(userId, siteId)).toBe(true);
  });
});
