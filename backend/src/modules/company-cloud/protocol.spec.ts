import { describe, expect, it } from "vitest";
import {
  constants,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  publicEncrypt,
  randomBytes,
} from "node:crypto";
import { decryptRemoteRequest, encryptRemoteResult, isAllowedRemotePath } from "./protocol";

const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privateKey = pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
function envelope(value: unknown, aad = "site:command") {
  const key = randomBytes(32),
    iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));
  return {
    key,
    packet: {
      key: publicEncrypt(
        { key: pair.publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
        key
      ).toString("base64"),
      iv: iv.toString("base64"),
      ciphertext: Buffer.concat([
        cipher.update(JSON.stringify(value)),
        cipher.final(),
        cipher.getAuthTag(),
      ]).toString("base64"),
    },
  };
}
describe("company remote control boundary", () => {
  it("rejects arbitrary URL, traversal, encoded and cloud-configuration requests", () => {
    for (const path of [
      "https://evil.test",
      "//evil.test",
      "/platform-operations/../health",
      "/platform-operations/%2e%2e/health",
      "/platform-operations/company-connection",
      "/platform-operations/company-connection/",
      "/sites",
      "/platform-auth#fragment",
    ])
      expect(isAllowedRemotePath(path)).toBe(false);
    expect(isAllowedRemotePath("/platform-operations/customers/123/admins")).toBe(true);
  });
  it("decrypts only for the matching site/command and preserves owner auth", () => {
    const value = {
      path: "/platform-operations",
      method: "GET",
      authorization: "Bearer owner.token",
      expiresAt: Date.now() + 60000,
    };
    const { packet } = envelope(value);
    expect(decryptRemoteRequest(packet, privateKey, "site:command").request).toEqual(value);
    expect(() => decryptRemoteRequest(packet, privateKey, "other:command")).toThrow();
    packet.ciphertext = packet.ciphertext.slice(0, -8) + "AAAAAAAA";
    expect(() => decryptRemoteRequest(packet, privateKey, "site:command")).toThrow();
  });
  it("rejects expired, distant expiry, unsupported method and forbidden path", () => {
    const base = { path: "/platform-auth/login", method: "POST", expiresAt: Date.now() + 60000 };
    for (const override of [
      { expiresAt: Date.now() - 1 },
      { expiresAt: Date.now() + 500000 },
      { method: "CONNECT" },
      { path: "/health" },
      { authorization: "Bearer bad\r\nHeader" },
    ]) {
      const { packet } = envelope({ ...base, ...override });
      expect(() => decryptRemoteRequest(packet, privateKey, "site:command")).toThrow();
    }
  });
  it("encrypts responses with distinct AAD and cannot expose a password or token to D1", () => {
    const key = randomBytes(32),
      value = { access_token: "secret-owner-token" };
    const result = encryptRemoteResult(value, key, "site:command");
    expect(JSON.stringify(result)).not.toContain(value.access_token);
    const data = Buffer.from(result.ciphertext, "base64"),
      cipher = createDecipheriv("aes-256-gcm", key, Buffer.from(result.iv, "base64"));
    cipher.setAAD(Buffer.from("site:command:response"));
    cipher.setAuthTag(data.subarray(-16));
    expect(
      JSON.parse(Buffer.concat([cipher.update(data.subarray(0, -16)), cipher.final()]).toString())
    ).toEqual(value);
  });
});
