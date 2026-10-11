import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseOwnerCommissioningTrustedKeyring } from "../modules/platform-auth/owner-commissioning-trust";

// Invoked only by the elevated Windows administration tool, never by the public API.
export function runInstallAdminRecoveryTrust(environment: NodeJS.ProcessEnv = process.env): number {
  try {
    const source = environment.BIOEMS_ADMIN_RECOVERY_TRUST_SOURCE;
    const receiptPath = environment.BIOEMS_INSTALLATION_PROVISIONING_RECEIPT_PATH;
    if (!source || !receiptPath || statSync(source).size > 65536)
      throw new Error("Invalid trust input");
    const keyring = parseOwnerCommissioningTrustedKeyring(
      JSON.parse(readFileSync(source, "utf8")) as unknown
    );
    if (!keyring.keys.some((key) => key.status === "active"))
      throw new Error("Active recovery key required");
    const directory = dirname(receiptPath);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "manufacturer-admin-recovery-trust.json"),
      `${JSON.stringify(keyring, null, 2)}\n`,
      { mode: 0o600 }
    );
    console.log("Approved ADMIN recovery public trust installed");
    return 0;
  } catch {
    console.error("ADMIN recovery public trust installation rejected");
    return 1;
  }
}
if (require.main === module) process.exitCode = runInstallAdminRecoveryTrust();
