import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
  randomBytes,
} from "node:crypto";

export interface CloudEnvelope {
  key: string;
  iv: string;
  ciphertext: string;
}
export interface RemoteRequest {
  path: string;
  method: string;
  authorization?: string;
  body?: string;
  expiresAt: number;
}
export function isAllowedRemotePath(path: string): boolean {
  // Reject encodings, fragments, alternate origins and normalization tricks.
  if (!/^\/[a-zA-Z0-9/_?=&.:-]*$/.test(path) || path.includes("..") || path.includes("//"))
    return false;
  const pathname = path.split("?")[0];
  if (pathname.startsWith("/platform-operations/company-connection")) return false;
  return ["/platform-auth", "/platform-operations", "/platform-audit-events"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
export function decryptRemoteRequest(envelope: CloudEnvelope, privateKey: string, aad: string) {
  const key = privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(envelope.key, "base64")
  );
  if (key.length !== 32) throw new Error("Invalid command key");
  const encrypted = Buffer.from(envelope.ciphertext, "base64"),
    iv = Buffer.from(envelope.iv, "base64");
  if (iv.length !== 12 || encrypted.length < 16 || encrypted.length > 300_000)
    throw new Error("Invalid command envelope");
  const cipher = createDecipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));
  cipher.setAuthTag(encrypted.subarray(-16));
  const request = JSON.parse(
    Buffer.concat([cipher.update(encrypted.subarray(0, -16)), cipher.final()]).toString("utf8")
  ) as RemoteRequest;
  if (
    typeof request.path !== "string" ||
    !isAllowedRemotePath(request.path) ||
    !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method) ||
    !Number.isSafeInteger(request.expiresAt) ||
    request.expiresAt < Date.now() ||
    request.expiresAt > Date.now() + 120_000 ||
    (request.body !== undefined && typeof request.body !== "string") ||
    (request.authorization !== undefined && !/^Bearer [a-zA-Z0-9._-]+$/.test(request.authorization))
  )
    throw new Error("Remote command rejected");
  return { key, request };
}
export function encryptRemoteResult(value: unknown, key: Buffer, aad: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`${aad}:response`));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return { iv: iv.toString("base64"), ciphertext: ciphertext.toString("base64") };
}
