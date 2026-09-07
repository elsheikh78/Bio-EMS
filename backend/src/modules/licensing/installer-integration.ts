import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  InstallationIdentityService,
  type InstallationIdentityEnvelope,
} from "./installation-identity.service";
import type { KeyProtector } from "./key-protection";

export interface InstallationProvisioningReceipt {
  schemaVersion: 1;
  installationId: string;
  identityPath: string;
  protection: string;
  publicKeySha256: string;
  provisionedAt: string;
  state: "NEW_UNACTIVATED_IDENTITY";
}

export interface ProvisionInstallationIdentityInput {
  identityPath: string;
  receiptPath: string;
  protector: KeyProtector;
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
  };
  mkdirSync(dirname(input.receiptPath), { recursive: true, mode: 0o700 });
  writeFileSync(input.receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  return receipt;
}
