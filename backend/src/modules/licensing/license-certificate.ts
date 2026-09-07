import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { z } from "zod";
import { createHardwareFingerprint, type HardwareFingerprint } from "./hardware-fingerprint";

const fingerprintSchema = z.object({
  schemaVersion: z.literal(1),
  componentHashes: z.record(z.string(), z.string()),
  compositeHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const licenseClaimsSchema = z
  .object({
    schemaVersion: z.literal(1),
    licenseId: z.string().uuid(),
    customerId: z.number().int().positive(),
    siteId: z.number().int().positive(),
    installationId: z.string().uuid(),
    hardwareFingerprint: fingerprintSchema,
    status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]),
    licenseType: z.enum(["TRIAL", "SUBSCRIPTION", "PERPETUAL"]),
    issuedAt: z.string().datetime(),
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    maintenanceUntil: z.string().datetime().nullable(),
    updateEntitlement: z.enum(["NONE", "FREE", "PAID"]),
    modules: z.array(z.string().min(1)).min(1),
    maximumGateways: z.number().int().nonnegative().nullable(),
    maximumDevices: z.number().int().nonnegative().nullable(),
    maximumSensors: z.number().int().nonnegative().nullable(),
    offlineGraceSeconds: z.number().int().nonnegative(),
  })
  .strict();

export type LicenseClaims = z.infer<typeof licenseClaimsSchema>;
export interface SignedLicenseCertificate {
  algorithm: "Ed25519";
  keyId: string;
  claims: LicenseClaims;
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

export function signLicenseCertificate(
  claims: LicenseClaims,
  keyId: string,
  privateKeyPem: string
): SignedLicenseCertificate {
  const parsed = licenseClaimsSchema.parse(claims);
  const signature = sign(null, Buffer.from(canonicalize(parsed)), createPrivateKey(privateKeyPem));
  return { algorithm: "Ed25519", keyId, claims: parsed, signature: signature.toString("base64") };
}

export function verifyLicenseCertificate(
  certificate: SignedLicenseCertificate,
  publicKeyPem: string
): LicenseClaims {
  if (certificate.algorithm !== "Ed25519")
    throw new Error("Unsupported license signature algorithm");
  const claims = licenseClaimsSchema.parse(certificate.claims);
  const valid = verify(
    null,
    Buffer.from(canonicalize(claims)),
    createPublicKey(publicKeyPem),
    Buffer.from(certificate.signature, "base64")
  );
  if (!valid) throw new Error("Invalid license certificate signature");
  return claims;
}

export { createHardwareFingerprint, type HardwareFingerprint };
