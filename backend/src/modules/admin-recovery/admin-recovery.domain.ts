import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { z } from "zod";

export const adminRecoveryRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    purpose: z.literal("CUSTOMER_ADMIN_RECOVERY_REQUEST"),
    requestId: z.string().uuid(),
    installationId: z.string().uuid(),
    username: z.string().trim().min(1).max(64),
    customerName: z.string().min(1).max(256),
    customerCode: z.string().min(1).max(128),
    siteName: z.string().min(1).max(256),
    siteCode: z.string().min(1).max(128),
    challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    requestedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();
export type AdminRecoveryRequest = z.infer<typeof adminRecoveryRequestSchema>;

export const adminRecoveryClaimsSchema = z
  .object({
    schemaVersion: z.literal(1),
    purpose: z.literal("CUSTOMER_ADMIN_PASSWORD_RESET"),
    requestId: z.string().uuid(),
    installationId: z.string().uuid(),
    username: z.string().min(1).max(64),
    challengeHash: z.string().regex(/^[a-f0-9]{64}$/),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();
export const adminRecoveryPackageSchema = z
  .object({
    algorithm: z.literal("Ed25519"),
    keyId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/),
    claims: adminRecoveryClaimsSchema,
    signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/),
  })
  .strict();
export type AdminRecoveryPackage = z.infer<typeof adminRecoveryPackageSchema>;

function canonical(value: Record<string, unknown>) {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
  );
}
export const recoveryHash = (value: string) => createHash("sha256").update(value).digest("hex");

export function issueAdminRecoveryPermit(
  input: unknown,
  keyId: string,
  privateKeyPem: string,
  passphrase: string,
  validityMinutes = 60,
  now = new Date()
): AdminRecoveryPackage {
  const request = adminRecoveryRequestSchema.parse(input);
  const requested = Date.parse(request.requestedAt);
  const requestExpiry = Date.parse(request.expiresAt);
  if (
    requested > now.getTime() ||
    requestExpiry <= now.getTime() ||
    requestExpiry <= requested ||
    requestExpiry - requested > 24 * 60 * 60_000 ||
    !Number.isInteger(validityMinutes) ||
    validityMinutes < 1 ||
    validityMinutes > 60
  ) {
    throw new Error("Invalid or expired ADMIN recovery request");
  }
  if (!passphrase || !privateKeyPem.includes("BEGIN ENCRYPTED PRIVATE KEY")) {
    throw new Error("An encrypted ADMIN recovery private key is required");
  }
  const key = createPrivateKey({ key: privateKeyPem, passphrase });
  if (key.asymmetricKeyType !== "ed25519") throw new Error("Ed25519 key required");
  const claims = adminRecoveryClaimsSchema.parse({
    schemaVersion: 1,
    purpose: "CUSTOMER_ADMIN_PASSWORD_RESET",
    requestId: request.requestId,
    installationId: request.installationId,
    username: request.username,
    challengeHash: recoveryHash(request.challenge),
    issuedAt: now.toISOString(),
    expiresAt: new Date(
      Math.min(requestExpiry, now.getTime() + validityMinutes * 60_000)
    ).toISOString(),
  });
  return adminRecoveryPackageSchema.parse({
    algorithm: "Ed25519",
    keyId,
    claims,
    signature: sign(null, Buffer.from(canonical(claims)), key).toString("base64"),
  });
}

export function verifyAdminRecoveryPermit(input: unknown, publicKeyPem: string, now = new Date()) {
  const candidate = adminRecoveryPackageSchema.parse(input);
  const key = createPublicKey(publicKeyPem);
  const issued = Date.parse(candidate.claims.issuedAt);
  const expiry = Date.parse(candidate.claims.expiresAt);
  if (
    key.asymmetricKeyType !== "ed25519" ||
    !verify(
      null,
      Buffer.from(canonical(candidate.claims)),
      key,
      Buffer.from(candidate.signature, "base64")
    ) ||
    issued > now.getTime() ||
    expiry <= now.getTime() ||
    expiry <= issued ||
    expiry - issued > 60 * 60_000
  ) {
    throw new Error("Invalid or expired ADMIN recovery permit");
  }
  return candidate;
}
