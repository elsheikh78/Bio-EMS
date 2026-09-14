import { createPrivateKey, createPublicKey, randomUUID, sign, verify } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import { normalizePlatformUsername } from "../../entities/PlatformPrincipal";

export const ownerCommissioningRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    commissioningId: z.string().uuid(),
    installationId: z.string().uuid(),
    requestedAt: z.string().datetime(),
  })
  .strict();

export type OwnerCommissioningRequest = z.infer<typeof ownerCommissioningRequestSchema>;

const bcryptHash = z.string().regex(/^\$2[aby]\$(1[2-9]|2[0-9]|3[01])\$[./A-Za-z0-9]{53}$/);

export const ownerCommissioningClaimsSchema = z
  .object({
    schemaVersion: z.literal(1),
    commissioningId: z.string().uuid(),
    installationId: z.string().uuid(),
    username: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9._-]+$/),
    passwordHash: bcryptHash,
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    mfaEnrollmentRequired: z.literal(true),
  })
  .strict();

export type OwnerCommissioningClaims = z.infer<typeof ownerCommissioningClaimsSchema>;

export interface SignedOwnerCommissioningPackage {
  algorithm: "Ed25519";
  keyId: string;
  claims: OwnerCommissioningClaims;
  signature: string;
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function signOwnerCommissioningPackage(
  claims: OwnerCommissioningClaims,
  keyId: string,
  privateKeyPem: string
): SignedOwnerCommissioningPackage {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(keyId)) {
    throw new Error("Invalid commissioning signing key ID");
  }
  const parsed = ownerCommissioningClaimsSchema.parse(claims);
  if (new Date(parsed.expiresAt).getTime() <= new Date(parsed.issuedAt).getTime()) {
    throw new Error("Commissioning expiry must follow issue time");
  }
  const signature = sign(null, Buffer.from(canonicalize(parsed)), createPrivateKey(privateKeyPem));
  return { algorithm: "Ed25519", keyId, claims: parsed, signature: signature.toString("base64") };
}

export function verifyOwnerCommissioningPackage(
  candidate: SignedOwnerCommissioningPackage,
  publicKeyPem: string,
  expectedInstallationId: string,
  now = new Date()
): OwnerCommissioningClaims {
  if (candidate.algorithm !== "Ed25519") throw new Error("Unsupported commissioning algorithm");
  const claims = ownerCommissioningClaimsSchema.parse(candidate.claims);
  const valid = verify(
    null,
    Buffer.from(canonicalize(claims)),
    createPublicKey(publicKeyPem),
    Buffer.from(candidate.signature, "base64")
  );
  if (!valid) throw new Error("Invalid commissioning signature");
  if (claims.installationId !== expectedInstallationId) {
    throw new Error("Commissioning package belongs to a different installation");
  }
  const issuedAt = new Date(claims.issuedAt).getTime();
  const expiresAt = new Date(claims.expiresAt).getTime();
  if (expiresAt <= issuedAt || now.getTime() < issuedAt || now.getTime() >= expiresAt) {
    throw new Error("Commissioning package is not currently valid");
  }
  return claims;
}

export function applyOwnerCommissioning(
  database: Database.Database,
  claims: OwnerCommissioningClaims,
  signingKeyId: string,
  now = new Date()
): string {
  return database.transaction(() => {
    const replay = database
      .prepare("SELECT 1 FROM owner_commissioning_receipts WHERE commissioning_id = ?")
      .get(claims.commissioningId);
    if (replay) throw new Error("Commissioning package has already been used");
    const existing = database
      .prepare("SELECT 1 FROM platform_principals WHERE principal_type = 'SYSTEM_OWNER' LIMIT 1")
      .get();
    if (existing) throw new Error("SYSTEM_OWNER already exists");

    const ownerId = randomUUID();
    database
      .prepare(
        `INSERT INTO platform_principals
          (id, principal_type, username, password_hash, status)
         VALUES (?, 'SYSTEM_OWNER', ?, ?, 'active')`
      )
      .run(ownerId, normalizePlatformUsername(claims.username), claims.passwordHash);
    database
      .prepare(
        `INSERT INTO owner_commissioning_receipts
          (commissioning_id, installation_id, signing_key_id, issued_at, expires_at, applied_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        claims.commissioningId,
        claims.installationId,
        signingKeyId,
        claims.issuedAt,
        claims.expiresAt,
        now.toISOString()
      );
    database
      .prepare(
        `INSERT INTO audit_events (
          id, occurred_at, actor_kind, actor_id, actor_username, actor_role,
          action, target_type, target_id, result, request_id, source_context
        ) VALUES (?, ?, 'PLATFORM', 'manufacturer-authority', 'manufacturer-authority',
          'MANUFACTURER_SIGNING_AUTHORITY', 'SYSTEM_OWNER_COMMISSIONED',
          'PLATFORM_PRINCIPAL', ?, 'SUCCESS', ?, 'OWNER_COMMISSIONING')`
      )
      .run(randomUUID(), now.toISOString(), ownerId, claims.commissioningId);
    return ownerId;
  })();
}
