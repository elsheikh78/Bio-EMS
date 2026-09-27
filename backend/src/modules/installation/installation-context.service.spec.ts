import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTables } from "../../../database/sqlite/schema";
import { migration018 } from "../../../database/sqlite/migrations/018_create_commercial_operations";
import { migration019 } from "../../../database/sqlite/migrations/019_create_customer_ownership";
import { InstallationContextService } from "./installation-context.service";

describe("installation context", () => {
  let database: Database.Database;
  let directory: string;
  let receiptPath: string;
  let service: InstallationContextService;

  beforeEach(() => {
    database = new Database(":memory:");
    database.pragma("foreign_keys=ON");
    createTables(database);
    migration018.up(database);
    migration019.up(database);

    const customerId = Number(
      database
        .prepare(
          `INSERT INTO platform_customers(code,name,status,created_at,created_by)
           VALUES('BIO-EGYPT','Bio Egypt','ACTIVE',?,'test')`
        )
        .run(new Date().toISOString()).lastInsertRowid
    );
    const siteId = Number(
      database
        .prepare(
          `INSERT INTO sites(code,name,location,timezone,active)
           VALUES('elmanial-001','El Manial','Cairo','Africa/Cairo',1)`
        )
        .run().lastInsertRowid
    );
    database
      .prepare(
        `INSERT INTO customer_site_bindings(customer_id,site_id,bound_at,bound_by)
         VALUES(?,?,?,'test')`
      )
      .run(customerId, siteId, new Date().toISOString());

    directory = mkdtempSync(join(tmpdir(), "bioems-installation-context-"));
    receiptPath = join(directory, "receipt.json");
    writeFileSync(
      receiptPath,
      JSON.stringify({
        schemaVersion: 1,
        installationId: "11111111-1111-4111-8111-111111111111",
        customerSite: {
          customerName: "Bio Egypt",
          customerCode: "BIO-EGYPT",
          siteName: "El Manial",
          siteCode: "elmanial-001",
        },
      })
    );
    service = new InstallationContextService(database);
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("resolves the installer identity against the authoritative registry", () => {
    expect(
      service.current({
        BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH: receiptPath,
      })
    ).toEqual({
      installationId: "11111111-1111-4111-8111-111111111111",
      source: "INSTALLER_PROVISIONING_RECEIPT",
      customer: { id: 1, code: "BIO-EGYPT", name: "Bio Egypt" },
      site: {
        id: 1,
        code: "elmanial-001",
        name: "El Manial",
        location: "Cairo",
        timezone: "Africa/Cairo",
      },
    });
  });

  it("rejects contradictory installer and registry identity", () => {
    database
      .prepare("UPDATE platform_customers SET name='Different customer' WHERE code='BIO-EGYPT'")
      .run();

    expect(() =>
      service.current({
        BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH: receiptPath,
      })
    ).toThrow(
      expect.objectContaining({ code: "INSTALLATION_IDENTITY_CONTEXT_MISMATCH" })
    );
  });
});
