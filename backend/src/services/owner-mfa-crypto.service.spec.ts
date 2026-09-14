import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decryptMfaSecret,
  encryptMfaSecret,
  parseMfaEncryptionKey,
} from "./owner-mfa-crypto.service";

describe("owner MFA secret encryption", () => {
  it("round-trips a TOTP secret without exposing plaintext", () => {
    const key = randomBytes(32);
    const secret = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptMfaSecret(secret, key);

    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain(secret);
    expect(decryptMfaSecret(encrypted, key)).toBe(secret);
  });

  it("uses a fresh nonce for every encryption", () => {
    const key = randomBytes(32);
    const first = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);
    const second = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);

    expect(first).not.toBe(second);
  });

  it("rejects tampering and the wrong key", () => {
    const key = randomBytes(32);
    const encrypted = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);
    const tampered = encrypted.slice(0, -1) + (encrypted.endsWith("A") ? "B" : "A");

    expect(() => decryptMfaSecret(tampered, key)).toThrow(/authentication failed/);
    expect(() => decryptMfaSecret(encrypted, randomBytes(32))).toThrow(/authentication failed/);
  });

  it("accepts only canonical base64 keys containing exactly 32 bytes", () => {
    const encoded = randomBytes(32).toString("base64");
    expect(parseMfaEncryptionKey(encoded)).toHaveLength(32);
    expect(() => parseMfaEncryptionKey(randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
    expect(() => parseMfaEncryptionKey("not-base64")).toThrow(/32 bytes/);
  });
});
