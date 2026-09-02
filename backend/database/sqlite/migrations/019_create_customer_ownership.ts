import type Database from "better-sqlite3";
import type { Migration } from "../migration-runner";

const LEGACY_CUSTOMER_CODE = "LEGACY-UNASSIGNED";

export const migration019: Migration = {
  version: 19,
  description: "Create explicit customer ownership bindings",
  up(database: Database.Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS customer_site_bindings (
        customer_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL UNIQUE,
        bound_at TEXT NOT NULL,
        bound_by TEXT NOT NULL,
        PRIMARY KEY(customer_id, site_id),
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_customer_site_bindings_customer
        ON customer_site_bindings(customer_id, site_id);

      CREATE TABLE IF NOT EXISTS customer_user_bindings (
        customer_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL UNIQUE,
        bound_at TEXT NOT NULL,
        bound_by TEXT NOT NULL,
        PRIMARY KEY(customer_id, user_id),
        FOREIGN KEY(customer_id) REFERENCES platform_customers(id) ON DELETE RESTRICT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_customer_user_bindings_customer
        ON customer_user_bindings(customer_id, user_id);
    `);

    const hasSites = tableExists(database, "sites");
    const hasUsers = tableExists(database, "users");
    const siteCount = hasSites
      ? (database.prepare("SELECT COUNT(*) AS count FROM sites").get() as { count: number }).count
      : 0;
    const userCount = hasUsers
      ? (database.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count
      : 0;
    if (siteCount + userCount === 0) return;

    const now = new Date().toISOString();
    database
      .prepare(
        `INSERT INTO platform_customers (code,name,status,created_at,created_by)
         VALUES (?,?,?,?,'MIGRATION_019') ON CONFLICT(code) DO NOTHING`
      )
      .run(LEGACY_CUSTOMER_CODE, "Legacy unassigned records", "SUSPENDED", now);
    const customer = database
      .prepare("SELECT id FROM platform_customers WHERE code = ?")
      .get(LEGACY_CUSTOMER_CODE) as { id: number };

    if (hasSites) {
      database
        .prepare(
          `INSERT OR IGNORE INTO customer_site_bindings
           (customer_id,site_id,bound_at,bound_by)
           SELECT ?,id,?,'MIGRATION_019' FROM sites`
        )
        .run(customer.id, now);
    }
    if (hasUsers) {
      database
        .prepare(
          `INSERT OR IGNORE INTO customer_user_bindings
           (customer_id,user_id,bound_at,bound_by)
           SELECT ?,id,?,'MIGRATION_019' FROM users`
        )
        .run(customer.id, now);
    }
  },
};

function tableExists(database: Database.Database, table: string): boolean {
  return Boolean(
    database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );
}
