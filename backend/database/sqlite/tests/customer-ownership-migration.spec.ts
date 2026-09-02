import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTables } from "../schema";
import { migration018 } from "../migrations/018_create_commercial_operations";
import { migration019 } from "../migrations/019_create_customer_ownership";

describe("customer ownership migration", () => {
  let database: Database.Database;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys = ON");
    createTables(database);
    migration018.up(database);
  });
  afterEach(() => database.close());

  it("backfills existing Sites and Users into an explicit suspended legacy customer", () => {
    const siteId = Number(
      database.prepare("INSERT INTO sites (code,name) VALUES ('LEGACY01','Legacy Site')").run()
        .lastInsertRowid
    );
    const userId = Number(
      database
        .prepare(
          `INSERT INTO users (username,password_hash,role,status)
           VALUES ('legacy-admin','$2b$12$a4qNLowNiYMqjgUx2Pa8D.ubXSEImfhQDmrsw.MYU80cl5Ge4FijK','ADMIN','active')`
        )
        .run().lastInsertRowid
    );

    migration019.up(database);

    expect(database.prepare("SELECT code,status FROM platform_customers").get()).toEqual({
      code: "LEGACY-UNASSIGNED",
      status: "SUSPENDED",
    });
    expect(database.prepare("SELECT site_id FROM customer_site_bindings").get()).toEqual({
      site_id: siteId,
    });
    expect(database.prepare("SELECT user_id FROM customer_user_bindings").get()).toEqual({
      user_id: userId,
    });
  });

  it("does not invent a legacy customer for a clean database and remains idempotent", () => {
    migration019.up(database);
    migration019.up(database);
    expect(database.prepare("SELECT COUNT(*) AS count FROM platform_customers").get()).toEqual({
      count: 0,
    });
  });
});
