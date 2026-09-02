import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration019 } from "../../../database/sqlite/migrations/019_create_customer_ownership";
import { CustomerAdminService } from "./customer-admin.service";

const HASH = "$2b$12$abcdefghijklmnopqrstuvwxyzABCDEabcdefghijklmnopqrstuvwxyz12";

describe("SYSTEM_OWNER customer administrator lifecycle", () => {
  let database: Database.Database;
  let service: CustomerAdminService;
  let firstCustomer: number;
  let secondCustomer: number;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys=ON");
    database.exec(`
      CREATE TABLE sites(id INTEGER PRIMARY KEY);
      CREATE TABLE users(
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, email TEXT,
        password_hash TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    migration018.up(database);
    migration019.up(database);
    const insertCustomer = database.prepare(
      "INSERT INTO platform_customers(code,name,status,created_at,created_by) VALUES(?,?,'ACTIVE',?,'seed')"
    );
    firstCustomer = Number(
      insertCustomer.run("C1", "Customer one", new Date().toISOString()).lastInsertRowid
    );
    secondCustomer = Number(
      insertCustomer.run("C2", "Customer two", new Date().toISOString()).lastInsertRowid
    );
    service = new CustomerAdminService(database);
  });

  afterEach(() => database.close());

  it("creates and binds an ADMIN without exposing its password hash", async () => {
    const created = await service.create(
      firstCustomer,
      { username: "customer-admin", email: "admin@example.com", password: "StrongPassword1" },
      "owner#1"
    );
    expect(created).toMatchObject({ role: "ADMIN", status: "active" });
    expect(created).not.toHaveProperty("password_hash");
    expect(service.list(firstCustomer)).toHaveLength(1);
    expect(service.list(secondCustomer)).toHaveLength(0);
  });

  it("rejects cross-customer administration", () => {
    const userId = seedAdmin(firstCustomer, "admin-one");
    expect(() => service.updateStatus(secondCustomer, userId, "disabled", "owner#1")).toThrow(
      expect.objectContaining({ code: "CUSTOMER_ADMIN_NOT_FOUND" })
    );
  });

  it("preserves at least one active ADMIN for each customer", () => {
    const first = seedAdmin(firstCustomer, "admin-one");
    expect(() => service.updateStatus(firstCustomer, first, "disabled", "owner#1")).toThrow(
      expect.objectContaining({ code: "LAST_ACTIVE_CUSTOMER_ADMIN_REQUIRED" })
    );
    const second = seedAdmin(firstCustomer, "admin-two");
    expect(service.updateStatus(firstCustomer, second, "disabled", "owner#1")).toMatchObject({
      status: "disabled",
    });
  });

  function seedAdmin(customerId: number, username: string): number {
    const result = database
      .prepare("INSERT INTO users(username,password_hash,role,status) VALUES(?,?,'ADMIN','active')")
      .run(username, HASH);
    const userId = Number(result.lastInsertRowid);
    database
      .prepare(
        "INSERT INTO customer_user_bindings(customer_id,user_id,bound_at,bound_by) VALUES(?,?,?,'seed')"
      )
      .run(customerId, userId, new Date().toISOString());
    return userId;
  }
});
