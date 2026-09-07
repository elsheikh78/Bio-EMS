import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface SigningKeyGenerationResult {
  keyId: string;
  privateKeyPath: string;
  publicKeyPath: string;
  manifestPath: string;
}

export function generateLicenseSigningKey(
  outputDirectory: string,
  keyId: string,
  now = new Date()
): SigningKeyGenerationResult {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(keyId)) {
    throw new Error("Signing key ID must be 3-64 safe characters");
  }
  const result = {
    keyId,
    privateKeyPath: join(outputDirectory, `${keyId}.private.pem`),
    publicKeyPath: join(outputDirectory, `${keyId}.public.pem`),
    manifestPath: join(outputDirectory, `${keyId}.manifest.json`),
  };
  if ([result.privateKeyPath, result.publicKeyPath, result.manifestPath].some(existsSync)) {
    throw new Error("Signing key target already exists; rotation must use a new key ID");
  }

  const pair = generateKeyPairSync("ed25519");
  const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const publicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  writeFileSync(result.privateKeyPath, privateKey, { flag: "wx", mode: 0o600 });
  writeFileSync(result.publicKeyPath, publicKey, { flag: "wx", mode: 0o644 });
  writeFileSync(
    result.manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        keyId,
        algorithm: "Ed25519",
        createdAt: now.toISOString(),
        privateKeyExportPolicy: "OFFLINE_SIGNING_AUTHORITY_ONLY",
      },
      null,
      2
    )}\n`,
    { flag: "wx", mode: 0o600 }
  );
  return result;
}
