import Database from "better-sqlite3";
import {
  chmodSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { z } from "zod";

const customerSiteSchema = z
  .object({
    customerName: z.string().trim().min(1),
    customerCode: z.string().trim().min(1),
    siteName: z.string().trim().min(1),
    siteCode: z.string().trim().min(1),
    siteLocation: z.string().trim().max(300).nullable().optional(),
  })
  .passthrough();

const receiptSchema = z
  .object({
    schemaVersion: z.literal(1),
    installationId: z.string().uuid(),
    customerSite: customerSiteSchema.optional(),
  })
  .passthrough();

const identitySchema = z
  .object({
    schemaVersion: z.literal(1),
    installationId: z.string().uuid(),
  })
  .passthrough();

type BootstrapBindingRow = {
  customerCode: string;
  customerName: string;
  siteCode: string;
  siteName: string;
  siteLocation: string | null;
};

export interface RepairInstallationProvisioningReceiptInput {
  receiptPath: string;
  identityPath: string;
  sqlitePath?: string;
  database?: Database.Database;
}

export type RepairInstallationProvisioningReceiptResult = {
  installationId: string;
  state: "ALREADY_COMPLETE" | "REPAIRED";
};

export function repairInstallationProvisioningReceipt(
  input: RepairInstallationProvisioningReceiptInput,
): RepairInstallationProvisioningReceiptResult {
  const receipt = receiptSchema.parse(
    JSON.parse(readFileSync(input.receiptPath, "utf8")),
  );
  const identity = identitySchema.parse(
    JSON.parse(readFileSync(input.identityPath, "utf8")),
  );

  if (receipt.installationId !== identity.installationId) {
    throw new Error(
      "Installation identity and provisioning receipt installation IDs do not match",
    );
  }

  if (!input.database && !input.sqlitePath) {
    throw new Error("SQLite path is required when no database handle is supplied");
  }

  const ownsDatabase = !input.database;
  const database =
    input.database ??
    new Database(input.sqlitePath!, {
      readonly: true,
      fileMustExist: true,
    });

  try {
    const rows = database
      .prepare(
        `SELECT
           c.code AS customerCode,
           c.name AS customerName,
           s.code AS siteCode,
           s.name AS siteName,
           s.location AS siteLocation
         FROM customer_site_bindings b
         JOIN platform_customers c ON c.id = b.customer_id
         JOIN sites s ON s.id = b.site_id
         WHERE b.bound_by = 'INSTALLER_ADMIN_BOOTSTRAP'
           AND c.created_by = 'INSTALLER_ADMIN_BOOTSTRAP'
           AND c.status = 'ACTIVE'
           AND s.active = 1
         ORDER BY b.customer_id, b.site_id`,
      )
      .all() as BootstrapBindingRow[];

    if (rows.length !== 1) {
      throw new Error(
        `Expected exactly one installer-bootstrap customer/site binding, found ${rows.length}`,
      );
    }

    const row = rows[0];
    const expectedCustomerSite = {
      customerName: row.customerName,
      customerCode: row.customerCode,
      siteName: row.siteName,
      siteCode: row.siteCode,
      ...(row.siteLocation ? { siteLocation: row.siteLocation } : {}),
    };

    if (receipt.customerSite) {
      const current = receipt.customerSite;
      const currentLocation = current.siteLocation || undefined;
      const expectedLocation = expectedCustomerSite.siteLocation || undefined;
      if (
        current.customerName !== expectedCustomerSite.customerName ||
        current.customerCode !== expectedCustomerSite.customerCode ||
        current.siteName !== expectedCustomerSite.siteName ||
        current.siteCode !== expectedCustomerSite.siteCode ||
        currentLocation !== expectedLocation
      ) {
        throw new Error(
          "Existing provisioning receipt customer/site identity does not match installer-bootstrap registry identity",
        );
      }
      return {
        installationId: receipt.installationId,
        state: "ALREADY_COMPLETE",
      };
    }

    const repaired = receiptSchema.parse({
      ...receipt,
      customerSite: expectedCustomerSite,
    });
    const temporaryPath = `${input.receiptPath}.repair-${process.pid}`;

    try {
      writeFileSync(
        temporaryPath,
        `${JSON.stringify(repaired, null, 2)}\n`,
        {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        },
      );
      receiptSchema.parse(JSON.parse(readFileSync(temporaryPath, "utf8")));
      renameSync(temporaryPath, input.receiptPath);
      chmodSync(input.receiptPath, 0o600);
    } catch (error) {
      rmSync(temporaryPath, { force: true });
      throw error;
    }

    return {
      installationId: receipt.installationId,
      state: "REPAIRED",
    };
  } finally {
    if (ownsDatabase) database.close();
  }
}
