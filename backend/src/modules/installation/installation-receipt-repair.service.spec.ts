import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { repairInstallationProvisioningReceipt } from "./installation-receipt-repair.service";

const INSTALLATION_ID = "8e5e2867-9346-4be4-952c-0a935a75597b";

describe("installation provisioning receipt repair", () => {
  let directory: string;
  let database: Database.Database;
  let receiptPath: string;
  let identityPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "bioems-receipt-repair-"));
    receiptPath = join(directory, "installation-provisioning-receipt.json");
    identityPath = join(directory, "installation-identity.json");
    database = new Database(":memory:");
    database.exec(`
      CREATE TABLE platform_customers (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_by TEXT
      );
      CREATE TABLE sites (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        active INTEGER NOT NULL
      );
      CREATE TABLE customer_site_bindings (
        customer_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        bound_by TEXT NOT NULL
      );
    `);
    database
      .prepare(
        "INSERT INTO platform_customers(id,code,name,status,created_by) VALUES(1,'EMS-001','Bio Egypt','ACTIVE','INSTALLER_ADMIN_BOOTSTRAP')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO sites(id,code,name,location,active) VALUES(1,'manial01','Elmanial Warehouse',NULL,1)"
      )
      .run();
    database
      .prepare(
        "INSERT INTO customer_site_bindings(customer_id,site_id,bound_by) VALUES(1,1,'INSTALLER_ADMIN_BOOTSTRAP')"
      )
      .run();
    writeFileSync(
      identityPath,
      JSON.stringify({ schemaVersion: 1, installationId: INSTALLATION_ID })
    );
    writeFileSync(
      receiptPath,
      JSON.stringify({
        schemaVersion: 1,
        installationId: INSTALLATION_ID,
        state: "NEW_UNACTIVATED_IDENTITY",
      })
    );
  });

  afterEach(() => {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("backfills customer/site metadata from the unique installer-bootstrap binding", () => {
    expect(
      repairInstallationProvisioningReceipt({
        receiptPath,
        identityPath,
        database,
      })
    ).toEqual({ installationId: INSTALLATION_ID, state: "REPAIRED" });

    expect(JSON.parse(readFileSync(receiptPath, "utf8"))).toMatchObject({
      installationId: INSTALLATION_ID,
      customerSite: {
        customerName: "Bio Egypt",
        customerCode: "EMS-001",
        siteName: "Elmanial Warehouse",
        siteCode: "manial01",
      },
    });
  });

  it("leaves an already matching receipt unchanged", () => {
    writeFileSync(
      receiptPath,
      JSON.stringify({
        schemaVersion: 1,
        installationId: INSTALLATION_ID,
        customerSite: {
          customerName: "Bio Egypt",
          customerCode: "EMS-001",
          siteName: "Elmanial Warehouse",
          siteCode: "manial01",
        },
      })
    );

    expect(
      repairInstallationProvisioningReceipt({
        receiptPath,
        identityPath,
        database,
      })
    ).toEqual({ installationId: INSTALLATION_ID, state: "ALREADY_COMPLETE" });
  });

  it("fails closed when installer-bootstrap provenance is ambiguous", () => {
    database
      .prepare(
        "INSERT INTO platform_customers(id,code,name,status,created_by) VALUES(2,'OTHER','Other','ACTIVE','INSTALLER_ADMIN_BOOTSTRAP')"
      )
      .run();
    database
      .prepare(
        "INSERT INTO sites(id,code,name,location,active) VALUES(2,'other-site','Other Site',NULL,1)"
      )
      .run();
    database
      .prepare(
        "INSERT INTO customer_site_bindings(customer_id,site_id,bound_by) VALUES(2,2,'INSTALLER_ADMIN_BOOTSTRAP')"
      )
      .run();

    expect(() =>
      repairInstallationProvisioningReceipt({
        receiptPath,
        identityPath,
        database,
      })
    ).toThrow("Expected exactly one installer-bootstrap customer/site binding");
  });

  it("fails closed when receipt and installation identity IDs differ", () => {
    writeFileSync(
      identityPath,
      JSON.stringify({
        schemaVersion: 1,
        installationId: "11111111-1111-4111-8111-111111111111",
      })
    );

    expect(() =>
      repairInstallationProvisioningReceipt({
        receiptPath,
        identityPath,
        database,
      })
    ).toThrow("Installation identity and provisioning receipt installation IDs do not match");
  });
});
