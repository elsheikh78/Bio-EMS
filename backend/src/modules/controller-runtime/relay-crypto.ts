import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
export const relayEnvelopeSchema = z
  .object({
    binding: z.uuid(),
    nonce: z.string().regex(/^[a-f0-9]{24}$/),
    data: z
      .string()
      .regex(/^[a-f0-9]+$/)
      .max(6144),
    tag: z.string().regex(/^[a-f0-9]{32}$/),
  })
  .strict();
export type RelayEnvelope = z.infer<typeof relayEnvelopeSchema>;
export function decryptRelay(envelope: RelayEnvelope, key: Buffer): unknown {
  if (envelope.data.length % 2) throw new Error("Invalid cipher length");
  const cipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.nonce, "hex"));
  cipher.setAAD(Buffer.from(envelope.binding));
  cipher.setAuthTag(Buffer.from(envelope.tag, "hex"));
  return JSON.parse(
    Buffer.concat([cipher.update(Buffer.from(envelope.data, "hex")), cipher.final()]).toString(
      "utf8"
    )
  );
}
export function encryptRelay(binding: string, value: unknown, key: Buffer): RelayEnvelope {
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(binding));
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return {
    binding,
    nonce: nonce.toString("hex"),
    data: data.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}
