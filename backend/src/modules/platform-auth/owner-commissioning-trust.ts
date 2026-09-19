import { createPublicKey } from "node:crypto";
import { z } from "zod";

const trustedKeySchema = z
  .object({
    keyId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/),
    publicKeyPem: z.string().min(1).max(4096),
    status: z.enum(["active", "revoked"]),
  })
  .strict();

const trustedKeyringSchema = z
  .object({
    schemaVersion: z.literal(1),
    keys: z.array(trustedKeySchema).min(1).max(16),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const key of value.keys) {
      if (ids.has(key.keyId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate trusted key ID",
          path: ["keys"],
        });
      }
      ids.add(key.keyId);
    }
  });

export interface OwnerCommissioningTrustedKeyring {
  schemaVersion: 1;
  keys: Array<{
    keyId: string;
    publicKeyPem: string;
    status: "active" | "revoked";
  }>;
}

export function parseOwnerCommissioningTrustedKeyring(
  candidate: unknown
): OwnerCommissioningTrustedKeyring {
  const parsed = trustedKeyringSchema.parse(candidate);
  for (const key of parsed.keys) {
    const publicKey = createPublicKey(key.publicKeyPem);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      throw new Error("Trusted owner commissioning key must be Ed25519");
    }
  }
  return parsed;
}

export function resolveOwnerCommissioningPublicKey(
  keyring: OwnerCommissioningTrustedKeyring,
  keyId: string
): string {
  const trusted = keyring.keys.find((key) => key.keyId === keyId);
  if (!trusted || trusted.status !== "active") {
    throw new Error("Owner commissioning signing key is not trusted");
  }
  return trusted.publicKeyPem;
}
