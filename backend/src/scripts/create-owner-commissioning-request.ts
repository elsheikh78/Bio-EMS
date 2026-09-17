import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import { ownerCommissioningRequestSchema } from "../modules/platform-auth/owner-commissioning";

const identitySchema = z
  .object({
    schemaVersion: z.literal(1),
    installationId: z.string().uuid(),
  })
  .passthrough();

export function runCreateOwnerCommissioningRequest(
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): number {
  try {
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const outputPath = environment.BIOEMS_OWNER_COMMISSIONING_REQUEST_OUTPUT;
    if (!identityPath || !outputPath) throw new Error("Commissioning request paths are required");
    const identity = identitySchema.parse(JSON.parse(readFileSync(identityPath, "utf8")));
    const request = ownerCommissioningRequestSchema.parse({
      schemaVersion: 1,
      commissioningId: randomUUID(),
      installationId: identity.installationId,
      requestedAt: now.toISOString(),
    });
    mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
    writeFileSync(outputPath, `${JSON.stringify(request, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    console.log("Owner commissioning request created; no credential or private key was included");
    return 0;
  } catch {
    console.error("Owner commissioning request creation failed");
    return 1;
  }
}

if (require.main === module) process.exitCode = runCreateOwnerCommissioningRequest();
