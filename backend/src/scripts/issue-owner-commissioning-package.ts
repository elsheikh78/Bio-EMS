import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import {
  ownerCommissioningRequestSchema,
  signOwnerCommissioningPackage,
} from "../modules/platform-auth/owner-commissioning";
import { hashPassword } from "../services/password.service";

export async function runIssueOwnerCommissioningPackage(
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): Promise<number> {
  try {
    const requestPath = environment.BIOEMS_OWNER_COMMISSIONING_REQUEST;
    const privateKeyPath = environment.BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY;
    const outputPath = environment.BIOEMS_OWNER_COMMISSIONING_PACKAGE_OUTPUT;
    const keyId = environment.BIOEMS_OWNER_COMMISSIONING_KEY_ID;
    const username = environment.BIOEMS_OWNER_COMMISSIONING_USERNAME;
    const password = environment.BIOEMS_OWNER_COMMISSIONING_PASSWORD;
    const privateKeyPassphrase =
      environment.BIOEMS_OWNER_COMMISSIONING_PRIVATE_KEY_PASSPHRASE;
    const validityMinutes = Number(environment.BIOEMS_OWNER_COMMISSIONING_VALIDITY_MINUTES || "15");
    if (!requestPath || !privateKeyPath || !outputPath || !keyId || !username || !password) {
      throw new Error("Owner commissioning issuance inputs are required");
    }
    if (!Number.isInteger(validityMinutes) || validityMinutes < 1 || validityMinutes > 60) {
      throw new Error("Owner commissioning validity must be 1-60 minutes");
    }

    const request = ownerCommissioningRequestSchema.parse(
      JSON.parse(readFileSync(requestPath, "utf8"))
    );
    const requestAge = now.getTime() - new Date(request.requestedAt).getTime();
    if (requestAge < 0 || requestAge > 24 * 60 * 60 * 1000) {
      throw new Error("Owner commissioning request is stale");
    }
    const passwordHash = await hashPassword(password);
    const claims = {
      schemaVersion: 1 as const,
      commissioningId: request.commissioningId,
      installationId: request.installationId,
      username: username.trim().toLowerCase(),
      passwordHash,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + validityMinutes * 60_000).toISOString(),
      mfaEnrollmentRequired: true as const,
    };
    const signed = signOwnerCommissioningPackage(
      claims,
      keyId,
      readFileSync(privateKeyPath, "utf8"),
      privateKeyPassphrase
    );
    writeFileSync(outputPath, `${JSON.stringify(signed, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Signed owner commissioning package created; plaintext credentials were not printed"
    );
    return 0;
  } catch {
    console.error("Owner commissioning package issuance failed");
    return 1;
  }
}

if (require.main === module) {
  void runIssueOwnerCommissioningPackage().then((code) => {
    process.exitCode = code;
  });
}
