import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type {
  CommunicationChannel,
  CommunicationChannelScope,
  CommunicationChannelSecrets,
} from "./communication-channel.schema";
import { communicationChannelSecretsSchema } from "./communication-channel.schema";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "v1";

export function parseCommunicationConfigEncryptionKey(encoded: string): Buffer {
  const key = Buffer.from(encoded, "base64");
  if (
    key.length !== 32 ||
    key.toString("base64").replace(/=+$/g, "") !== encoded.replace(/=+$/g, "")
  ) {
    throw new Error(
      "Communication configuration encryption key must be canonical base64 for 32 bytes"
    );
  }
  return key;
}

function aad(scope: CommunicationChannelScope, channel: CommunicationChannel): Buffer {
  return Buffer.from(
    `BIO-EMS:COMMUNICATION_CONFIG:v1:${scope.customerId}:${scope.siteId ?? "customer"}:${channel}`
  );
}

export function encryptCommunicationSecrets(
  secrets: CommunicationChannelSecrets,
  key: Buffer,
  scope: CommunicationChannelScope,
  channel: CommunicationChannel
): string {
  if (key.length !== 32)
    throw new Error("Communication configuration encryption key must be 32 bytes");
  const validated = communicationChannelSecretsSchema.parse(secrets);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(aad(scope, channel));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(validated), "utf8"),
    cipher.final(),
  ]);
  return [
    PREFIX,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptCommunicationSecrets(
  value: string,
  key: Buffer,
  scope: CommunicationChannelScope,
  channel: CommunicationChannel
): CommunicationChannelSecrets {
  if (key.length !== 32)
    throw new Error("Communication configuration encryption key must be 32 bytes");
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX)
    throw new Error("Invalid encrypted communication secrets");
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const encrypted = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) throw new Error();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(aad(scope, channel));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8"
    );
    return communicationChannelSecretsSchema.parse(JSON.parse(plaintext));
  } catch {
    throw new Error("Encrypted communication secrets authentication failed");
  }
}
