import "dotenv/config";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import {
  applyOwnerRecovery,
  ownerRecoveryRequestSchema,
  type SignedOwnerRecoveryPackage,
  verifyOwnerRecoveryPackage,
} from "../modules/platform-auth/owner-recovery";
import {
  parseOwnerCommissioningTrustedKeyring,
  resolveOwnerCommissioningPublicKey,
} from "../modules/platform-auth/owner-commissioning-trust";
import {
  describeOwnerImportError,
  loadOwnerImportEnvironment,
} from "./owner-import-environment";

const identitySchema = z
  .object({ schemaVersion: z.literal(1), installationId: z.string().uuid() })
  .passthrough();

export async function runImportOwnerRecoveryPackage(
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): Promise<number> {
  let database: Database.Database | undefined;
  try {
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const requestPath = environment.BIOEMS_OWNER_RECOVERY_REQUEST;
    const packagePath = environment.BIOEMS_OWNER_RECOVERY_PACKAGE;
    if (!identityPath || !requestPath || !packagePath)
      throw new Error("Owner recovery import paths are required");
    const identity = identitySchema.parse(JSON.parse(readFileSync(identityPath, "utf8")));
    const request = ownerRecoveryRequestSchema.parse(JSON.parse(readFileSync(requestPath, "utf8")));
    if (request.installationId !== identity.installationId)
      throw new Error("Recovery request belongs to a different installation");
    const candidate = JSON.parse(readFileSync(packagePath, "utf8")) as SignedOwnerRecoveryPackage;
    const keyringPath = join(dirname(identityPath), "manufacturer-owner-trust.json");
    const keyring = parseOwnerCommissioningTrustedKeyring(
      JSON.parse(readFileSync(keyringPath, "utf8"))
    );
    const publicKeyPem = resolveOwnerCommissioningPublicKey(keyring, candidate.keyId);
    const claims = verifyOwnerRecoveryPackage(candidate, publicKeyPem, request, now);

    loadOwnerImportEnvironment(environment);

    const [{ sqlite }, { createTables }, { runMigrations }] = await Promise.all([
      import("../../database/sqlite/client"),
      import("../../database/sqlite/schema"),
      import("../../database/sqlite/migration-runner"),
    ]);
    database = sqlite;
    createTables(database);
    runMigrations(database);
    applyOwnerRecovery(database, claims, candidate.keyId, now);
    console.log("System Owner password recovered from a valid manufacturer-signed package");
    return 0;
  } catch (error) {
    console.error(`System Owner recovery package rejected: ${describeOwnerImportError(error)}`);
    return 1;
  } finally {
    database?.close();
  }
}

if (require.main === module)
  void runImportOwnerRecoveryPackage().then((code) => {
    process.exitCode = code;
  });
