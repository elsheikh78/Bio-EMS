import { readFileSync, statSync, writeFileSync } from "node:fs";
import { parseOwnerCommissioningTrustedKeyring } from "../modules/platform-auth/owner-commissioning-trust";

// Only company-approved public material enters the signed Client Setup.
export function stageAdminRecoveryTrust(source: string, destination: string): void {
  if (statSync(source).size > 65536) throw new Error("Recovery trust file too large");
  const candidate: unknown = JSON.parse(readFileSync(source, "utf8"));
  const keyring = parseOwnerCommissioningTrustedKeyring(candidate);
  if (!keyring.keys.some((key) => key.status === "active"))
    throw new Error("Active recovery key required");
  for (const key of keyring.keys) {
    if (!key.publicKeyPem.trim().startsWith("-----BEGIN PUBLIC KEY-----"))
      throw new Error("Only public recovery keys may enter Setup");
  }
  writeFileSync(destination, `${JSON.stringify(keyring, null, 2)}\n`, {
    mode: 0o600,
    flag: "wx",
  });
}

if (require.main === module) {
  try {
    const [source, destination] = process.argv.slice(2);
    if (!source || !destination) throw new Error("Trust source and destination required");
    stageAdminRecoveryTrust(source, destination);
    console.log("Company ADMIN recovery public trust validated for Setup");
  } catch {
    console.error("Setup recovery public trust rejected");
    process.exitCode = 1;
  }
}
