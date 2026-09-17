import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { hashOwnerRecoveryChallenge, ownerRecoveryRequestSchema, signOwnerRecoveryPackage } from "../modules/platform-auth/owner-recovery";
import { hashPassword } from "../services/password.service";

export async function runIssueOwnerRecoveryPackage(environment: NodeJS.ProcessEnv = process.env, now = new Date()): Promise<number> {
  try {
    const requestPath = environment.BIOEMS_OWNER_RECOVERY_REQUEST;
    const privateKeyPath = environment.BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY;
    const outputPath = environment.BIOEMS_OWNER_RECOVERY_PACKAGE_OUTPUT;
    const keyId = environment.BIOEMS_OWNER_COMMISSIONING_KEY_ID;
    const newPassword = environment.BIOEMS_OWNER_RECOVERY_PASSWORD;
    const validityMinutes = Number(environment.BIOEMS_OWNER_RECOVERY_VALIDITY_MINUTES || "15");
    if (!requestPath || !privateKeyPath || !outputPath || !keyId || !newPassword) throw new Error("Owner recovery issuance inputs are required");
    if (!Number.isInteger(validityMinutes) || validityMinutes < 1 || validityMinutes > 60) throw new Error("Owner recovery validity must be 1-60 minutes");
    const request = ownerRecoveryRequestSchema.parse(JSON.parse(readFileSync(requestPath, "utf8")));
    const requestAge = now.getTime() - new Date(request.requestedAt).getTime();
    if (requestAge < 0 || requestAge > 24 * 60 * 60 * 1000) throw new Error("Owner recovery request is stale");
    const claims = {
      schemaVersion: 1 as const,
      purpose: "SYSTEM_OWNER_PASSWORD_RECOVERY" as const,
      recoveryId: request.recoveryId,
      installationId: request.installationId,
      challengeHash: hashOwnerRecoveryChallenge(request.challenge),
      passwordHash: await hashPassword(newPassword),
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + validityMinutes * 60_000).toISOString(),
    };
    const signed = signOwnerRecoveryPackage(claims, keyId, readFileSync(privateKeyPath, "utf8"));
    writeFileSync(outputPath, `${JSON.stringify(signed, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    console.log("Signed System Owner recovery package created; plaintext credential and private key were not printed");
    return 0;
  } catch {
    console.error("System Owner recovery package issuance failed");
    return 1;
  }
}

if (require.main === module) void runIssueOwnerRecoveryPackage().then((code) => { process.exitCode = code; });
