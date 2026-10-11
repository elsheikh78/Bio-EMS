import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { issueAdminRecoveryPermit } from "../modules/admin-recovery/admin-recovery.domain";

export function runIssueAdminRecoveryPackage(
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): number {
  try {
    const keyPath = environment.BIOEMS_ADMIN_RECOVERY_PRIVATE_KEY;
    const passphrase = environment.BIOEMS_ADMIN_RECOVERY_PASSPHRASE;
    const keyId = environment.BIOEMS_ADMIN_RECOVERY_KEY_ID;
    const output = environment.BIOEMS_ADMIN_RECOVERY_OUTPUT;
    if (
      !keyPath ||
      !passphrase ||
      !keyId ||
      !output ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(keyId)
    )
      throw new Error("Missing signing inputs");
    if (environment.BIOEMS_ADMIN_RECOVERY_MODE === "generate-key") {
      if (passphrase.length < 16 || existsSync(keyPath) || existsSync(output))
        throw new Error("New key targets and a strong passphrase are required");
      const generated = generateKeyPairSync("ed25519", {
        privateKeyEncoding: { type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase },
        publicKeyEncoding: { type: "spki", format: "pem" },
      });
      writeFileSync(keyPath, generated.privateKey, { flag: "wx", mode: 0o600 });
      writeFileSync(
        output,
        JSON.stringify(
          {
            schemaVersion: 1,
            keys: [{ keyId, status: "active", publicKeyPem: generated.publicKey }],
          },
          null,
          2
        ),
        { flag: "wx", mode: 0o600 }
      );
      console.log(
        "Encrypted ADMIN recovery key and public trust created; keep private material at the company"
      );
      return 0;
    }
    if (statSync(keyPath).size > 16384) throw new Error("Key file too large");
    const pem = readFileSync(keyPath, "utf8");
    if (!pem.includes("BEGIN ENCRYPTED PRIVATE KEY"))
      throw new Error("Encrypted private key required");
    const key = createPrivateKey({ key: pem, passphrase });
    if (key.asymmetricKeyType !== "ed25519") throw new Error("Ed25519 required");
    let result: unknown;
    if (environment.BIOEMS_ADMIN_RECOVERY_MODE === "export-trust") {
      result = {
        schemaVersion: 1,
        keys: [
          {
            keyId,
            status: "active",
            publicKeyPem: createPublicKey(key.export({ type: "pkcs8", format: "pem" })).export({
              type: "spki",
              format: "pem",
            }),
          },
        ],
      };
    } else {
      const requestPath = environment.BIOEMS_ADMIN_RECOVERY_REQUEST;
      if (!requestPath || statSync(requestPath).size > 16384)
        throw new Error("Invalid request file");
      const requestBytes = readFileSync(requestPath);
      const expectedHash = environment.BIOEMS_ADMIN_RECOVERY_REQUEST_SHA256;
      if (expectedHash && createHash("sha256").update(requestBytes).digest("hex") !== expectedHash)
        throw new Error("Request changed after company review");
      result = issueAdminRecoveryPermit(
        JSON.parse(requestBytes.toString("utf8")) as unknown,
        keyId,
        pem,
        passphrase,
        Number(environment.BIOEMS_ADMIN_RECOVERY_VALIDITY_MINUTES || "60"),
        now
      );
    }
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, {
      flag: "wx",
      encoding: "utf8",
      mode: 0o600,
    });
    console.log("ADMIN recovery output created; no passwords or private-key material printed");
    return 0;
  } catch {
    console.error(
      "ADMIN recovery signing failed: check request, encrypted key, passphrase, expiry and output path"
    );
    return 1;
  }
}
if (require.main === module) process.exitCode = runIssueAdminRecoveryPackage();
