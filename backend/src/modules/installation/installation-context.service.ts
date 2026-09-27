import { readFileSync } from "node:fs";
import type Database from "better-sqlite3";
import { z } from "zod";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";

const receiptSchema = z
  .object({
    schemaVersion: z.literal(1),
    installationId: z.string().uuid(),
    customerSite: z
      .object({
        customerName: z.string().trim().min(1),
        customerCode: z.string().trim().min(1),
        siteName: z.string().trim().min(1),
        siteCode: z.string().trim().min(1),
      })
      .passthrough(),
  })
  .passthrough();

type CustomerRow = {
  id: number;
  code: string;
  name: string;
  status: string;
};

type SiteRow = {
  id: number;
  code: string;
  name: string;
  location: string | null;
  timezone: string | null;
  active: number;
};

export class InstallationContextService {
  constructor(private readonly database: Database.Database = sqlite) {}

  current(environment: NodeJS.ProcessEnv = process.env) {
    const receiptPath = environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH;
    if (!receiptPath) {
      throw unavailable("Installation provisioning receipt path is not configured");
    }

    let receipt: z.infer<typeof receiptSchema>;
    try {
      receipt = receiptSchema.parse(JSON.parse(readFileSync(receiptPath, "utf8")));
    } catch {
      throw unavailable("Installation provisioning receipt is unavailable or invalid");
    }

    if (!receipt.customerSite) {
      throw unavailable("Installation provisioning receipt has no customer/site identity");
    }

    const identity = receipt.customerSite;
    const customer = this.database
      .prepare(
        "SELECT id,code,name,status FROM platform_customers WHERE code=? ORDER BY id DESC LIMIT 1"
      )
      .get(identity.customerCode) as CustomerRow | undefined;

    if (!customer || customer.status === "CLOSED" || customer.name !== identity.customerName) {
      throw mismatch();
    }

    const site = this.database
      .prepare(
        `SELECT s.id,s.code,s.name,s.location,s.timezone,s.active
         FROM sites s
         JOIN customer_site_bindings b ON b.site_id=s.id
         WHERE b.customer_id=? AND s.code=?
         ORDER BY s.id DESC LIMIT 1`
      )
      .get(customer.id, identity.siteCode) as SiteRow | undefined;

    if (!site || site.active !== 1 || site.name !== identity.siteName) {
      throw mismatch();
    }

    return {
      installationId: receipt.installationId,
      source: "INSTALLER_PROVISIONING_RECEIPT" as const,
      customer: {
        id: customer.id,
        code: customer.code,
        name: customer.name,
      },
      site: {
        id: site.id,
        code: site.code,
        name: site.name,
        location: site.location,
        timezone: site.timezone,
      },
    };
  }
}

function unavailable(message: string) {
  return new AppError(message, 409, "INSTALLATION_IDENTITY_CONTEXT_UNAVAILABLE");
}

function mismatch() {
  return new AppError(
    "Installed customer/site identity does not match the platform registry",
    409,
    "INSTALLATION_IDENTITY_CONTEXT_MISMATCH"
  );
}

export const installationContextService = new InstallationContextService();
