import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "v1";

export function parseMfaEncryptionKey(encoded: string): Buffer {
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32 || key.toString("base64").replace(/=+$/g, "") !== encoded.replace(/=+$/g, "")) {
    throw new Error("MFA encryption key must be canonical base64 for exactly 32 bytes");
  }
  return key;
}

export function encryptMfaSecret(secret: string, key: Buffer): string {
  if (key.length !== 32) throw new Error("MFA encryption key must be 32 bytes");
  if (!/^[A-Z2-7]{16,128}$/.test(secret)) throw new Error("Invalid MFA secret");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from("BIO-EMS:SYSTEM_OWNER:MFA:v1"));
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptMfaSecret(value: string, key: Buffer): string {
  if (key.length !== 32) throw new Error("MFA encryption key must be 32 bytes");
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new Error("Invalid encrypted MFA secret");
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const encrypted = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
      throw new Error("Invalid encrypted MFA secret");
    }
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from("BIO-EMS:SYSTEM_OWNER:MFA:v1"));
    decipher.setAuthTag(tag);
    const secret = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    if (!/^[A-Z2-7]{16,128}$/.test(secret)) throw new Error("Invalid MFA secret");
    return secret;
  } catch {
    throw new Error("Encrypted MFA secret authentication failed");
  }
}
