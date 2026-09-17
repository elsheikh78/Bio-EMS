import {
  createPrivateKey,
  createPublicKey,
  createHash,
  randomUUID,
  sign,
  verify,
} from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";

export const ownerRecoveryRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    recoveryId: z.string().uuid(),
    installationId: z.string().uuid(),
    challenge: z.string().min(32).max(256),
    requestedAt: z.string().datetime(),
  })
  .strict();

export type OwnerRecoveryRequest = z.infer<typeof ownerRecoveryRequestSchema>;

const bcryptHash = z.string().regex(/^\$2[aby]\$(1[2-9]|2[0-9]|3[01])\$[./A-Za-z0-9]{53}$/);

export const ownerRecoveryClaimsSchema = z
  .object({
    schemaVersion: z.literal(1),
    purpose: z.literal("SYSTEM_OWNER_PASSWORD_RECOVERY"),
    recoveryId: z.string().uuid(),
    installationId: z.string().uuid(),
    challengeHash: z.string().regex(/^[a-f0-9]{64}$/),
    passwordHash: bcryptHash,
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export type OwnerRecoveryClaims = z.infer<typeof ownerRecoveryClaimsSchema>;

export interface SignedOwnerRecoveryPackage {
  algorithm: "Ed25519";
  keyId: string;
  claims: OwnerRecoveryClaims;
  signature: string;
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashOwnerRecoveryChallenge(challenge: string): string {
  return createHash("sha256").update(challenge, "utf8").digest("hex");
}

export function signOwnerRecoveryPackage(
  claims: OwnerRecoveryClaims,
  keyId: string,
  privateKeyPem: string
): SignedOwnerRecoveryPackage {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(keyId))
    throw new Error("Invalid recovery signing key ID");
  const parsed = ownerRecoveryClaimsSchema.parse(claims);
  if (new Date(parsed.expiresAt).getTime() <= new Date(parsed.issuedAt).getTime())
    throw new Error("Recovery expiry must follow issue time");
  const signature = sign(null, Buffer.from(canonicalize(parsed)), createPrivateKey(privateKeyPem));
  return { algorithm: "Ed25519", keyId, claims: parsed, signature: signature.toString("base64") };
}

export function verifyOwnerRecoveryPackage(
  candidate: SignedOwnerRecoveryPackage,
  publicKeyPem: string,
  request: OwnerRecoveryRequest,
  now = new Date()
): OwnerRecoveryClaims {
  if (candidate.algorithm !== "Ed25519") throw new Error("Unsupported recovery algorithm");
  const claims = ownerRecoveryClaimsSchema.parse(candidate.claims);
  const valid = verify(
    null,
    Buffer.from(canonicalize(claims)),
    createPublicKey(publicKeyPem),
    Buffer.from(candidate.signature, "base64")
  );
  if (!valid) throw new Error("Invalid recovery signature");
  if (claims.installationId !== request.installationId || claims.recoveryId !== request.recoveryId)
    throw new Error("Recovery package does not match this request");
  if (claims.challengeHash !== hashOwnerRecoveryChallenge(request.challenge))
    throw new Error("Recovery challenge mismatch");
  const issuedAt = new Date(claims.issuedAt).getTime();
  const expiresAt = new Date(claims.expiresAt).getTime();
  if (expiresAt <= issuedAt || now.getTime() < issuedAt || now.getTime() >= expiresAt)
    throw new Error("Recovery package is not currently valid");
  return claims;
}

export function applyOwnerRecovery(
  database: Database.Database,
  claims: OwnerRecoveryClaims,
  signingKeyId: string,
  now = new Date()
): void {
  database.transaction(() => {
    const request = database
      .prepare(
        `SELECT status, challenge_hash FROM password_recovery_requests WHERE request_id = ? AND principal_type = 'SYSTEM_OWNER' LIMIT 1`
      )
      .get(claims.recoveryId) as { status: string; challenge_hash: string | null } | undefined;
    if (!request || request.status !== "PENDING" || request.challenge_hash !== claims.challengeHash)
      throw new Error("Recovery request is unavailable or already used");
    const owner = database
      .prepare(
        `SELECT id FROM platform_principals WHERE principal_type = 'SYSTEM_OWNER' AND status = 'active' LIMIT 1`
      )
      .get() as { id: string } | undefined;
    if (!owner) throw new Error("SYSTEM_OWNER is not commissioned");
    database
      .prepare(
        `UPDATE platform_principals SET password_hash = ?, failed_login_count = 0, last_failed_login_at = NULL, locked_until = NULL, session_version = session_version + 1, updated_at = ? WHERE id = ?`
      )
      .run(claims.passwordHash, now.toISOString(), owner.id);
    database
      .prepare(
        `UPDATE password_recovery_requests SET status = 'CONSUMED', approved_at = ?, consumed_at = ? WHERE request_id = ? AND status = 'PENDING'`
      )
      .run(now.toISOString(), now.toISOString(), claims.recoveryId);
    database
      .prepare(
        `INSERT INTO password_recovery_audit (event_type, request_id, principal_type, actor_type, actor_id, outcome, details_json) VALUES ('SYSTEM_OWNER_PASSWORD_RECOVERED', ?, 'SYSTEM_OWNER', 'MANUFACTURER_SIGNING_AUTHORITY', ?, 'SUCCESS', ?)`
      )
      .run(
        claims.recoveryId,
        signingKeyId,
        JSON.stringify({ installation_id: claims.installationId })
      );
  })();
}

export function createOwnerRecoveryId(): string {
  return randomUUID();
}
