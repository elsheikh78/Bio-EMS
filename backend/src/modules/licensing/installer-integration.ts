import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import {
  InstallationIdentityService,
  type InstallationIdentityEnvelope,
} from "./installation-identity.service";
import type { KeyProtector } from "./key-protection";

const installationCustomerSiteMetadataSchema = z
  .object({
    customerName: z.string().trim().min(1).max(200),
    customerCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    siteName: z.string().trim().min(1).max(200),
    siteCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    siteLocation: z.string().trim().max(300).nullable().optional(),
    contactName: z.string().trim().max(200).nullable().optional(),
    contactEmail: z.string().trim().email().max(254).nullable().optional(),
    contactPhone: z.string().trim().max(64).nullable().optional(),
  })
  .strict();

export type InstallationCustomerSiteMetadata = z.infer<
  typeof installationCustomerSiteMetadataSchema
>;

export interface InstallationProvisioningReceipt {
  schemaVersion: 1;
  installationId: string;
  identityPath: string;
  protection: string;
  publicKeySha256: string;
  provisionedAt: string;
  state: "NEW_UNACTIVATED_IDENTITY";
  customerSite?: InstallationCustomerSiteMetadata;
}

export interface ProvisionInstallationIdentityInput {
  identityPath: string;
  receiptPath: string;
  protector: KeyProtector;
  customerSite?: InstallationCustomerSiteMetadata;
  now?: Date;
}

/**
 * First-install hook for DEP-01. It deliberately creates an unactivated identity and
 * refuses any existing identity/receipt so an installer image cannot carry a cloned identity.
 */
export function provisionInstallationIdentity(
  input: ProvisionInstallationIdentityInput
): InstallationProvisioningReceipt {
  if (input.identityPath === input.receiptPath) {
    throw new Error("Installation identity and receipt paths must be different");
  }
  if (existsSync(input.identityPath) || existsSync(input.receiptPath)) {
    throw new Error("Installation identity provisioning requires a fresh target");
  }

  const customerSite = input.customerSite
    ? installationCustomerSiteMetadataSchema.parse(input.customerSite)
    : undefined;
  const identity: InstallationIdentityEnvelope = new InstallationIdentityService(
    input.identityPath,
    input.protector
  ).create(input.now);
  const receipt: InstallationProvisioningReceipt = {
    schemaVersion: 1,
    installationId: identity.installationId,
    identityPath: input.identityPath,
    protection: identity.protection,
    publicKeySha256: createHash("sha256").update(identity.publicKeyPem).digest("hex"),
    provisionedAt: identity.createdAt,
    state: "NEW_UNACTIVATED_IDENTITY",
    ...(customerSite ? { customerSite } : {}),
  };
  mkdirSync(dirname(input.receiptPath), { recursive: true, mode: 0o700 });
  writeFileSync(input.receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  return receipt;
}
