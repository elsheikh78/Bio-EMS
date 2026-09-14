import "dotenv/config";
import type Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  applyOwnerCommissioning,
  type SignedOwnerCommissioningPackage,
  verifyOwnerCommissioningPackage,
} from "../modules/platform-auth/owner-commissioning";

const identitySchema = z
  .object({
    schemaVersion: z.literal(1),
    installationId: z.string().uuid(),
  })
  .passthrough();

export async function runImportOwnerCommissioningPackage(
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): Promise<number> {
  let database: Database.Database | undefined;

  try {
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const packagePath = environment.BIOEMS_OWNER_COMMISSIONING_PACKAGE;
    const publicKeyPath = environment.BIOEMS_OWNER_COMMISSIONING_PUBLIC_KEY;
    if (!identityPath || !packagePath || !publicKeyPath) {
      throw new Error("Owner commissioning import paths are required");
    }

    const identity = identitySchema.parse(JSON.parse(readFileSync(identityPath, "utf8")));
    const candidate = JSON.parse(
      readFileSync(packagePath, "utf8")
    ) as SignedOwnerCommissioningPackage;
    const publicKeyPem = readFileSync(publicKeyPath, "utf8");
    const claims = verifyOwnerCommissioningPackage(
      candidate,
      publicKeyPem,
      identity.installationId,
      now
    );

    const [{ sqlite }, { createTables }, { runMigrations }] = await Promise.all([
      import("../../database/sqlite/client"),
      import("../../database/sqlite/schema"),
      import("../../database/sqlite/migration-runner"),
    ]);
    database = sqlite;
    createTables(database);
    runMigrations(database);
    applyOwnerCommissioning(database, claims, candidate.keyId, now);
    console.log("System Owner commissioned from a valid manufacturer-signed package");
    return 0;
  } catch {
    console.error("System Owner commissioning package rejected");
    return 1;
  } finally {
    database?.close();
  }
}

if (require.main === module) {
  void runImportOwnerCommissioningPackage().then((code) => {
    process.exitCode = code;
  });
}
