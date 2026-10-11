import { afterEach, describe, expect, it, vi } from "vitest";
import {
  constants,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  privateDecrypt,
  randomBytes,
  webcrypto,
} from "node:crypto";
import { companyRequest } from "./companyTransport";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
});
describe("company browser transport", () => {
  it("encrypts login/password and session bearer end to end, and decrypts the local response", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    sessionStorage.setItem(
      "bioems.company.selected-site",
      JSON.stringify({
        id: "site",
        publicKey: pair.publicKey.export({ format: "jwk" }),
      }),
    );
    let encryptedResult: { iv: string; ciphertext: string } | undefined;
    const fetch = vi.fn(async (_path: string, options?: RequestInit) => {
      await Promise.resolve();
      if (options?.method === "POST") {
        const outer = JSON.parse(options.body as string) as {
          id: string;
          envelope: { key: string; iv: string; ciphertext: string };
        };
        expect(options.body).not.toContain("owner-password");
        expect(options.body).not.toContain("owner.token");
        const key = privateDecrypt(
          {
            key: pair.privateKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
          },
          Buffer.from(outer.envelope.key, "base64"),
        );
        const bytes = Buffer.from(outer.envelope.ciphertext, "base64"),
          decipher = createDecipheriv(
            "aes-256-gcm",
            key,
            Buffer.from(outer.envelope.iv, "base64"),
          );
        decipher.setAAD(Buffer.from(`site:${outer.id}`));
        decipher.setAuthTag(bytes.subarray(-16));
        const payload = JSON.parse(
          Buffer.concat([
            decipher.update(bytes.subarray(0, -16)),
            decipher.final(),
          ]).toString(),
        ) as { authorization: string; body: string; path: string };
        expect(payload.authorization).toBe("Bearer owner.token");
        expect(payload.body).toContain("owner-password");
        expect(payload.path).toBe("/platform-auth/login");
        const iv = randomBytes(12),
          cipher = createCipheriv("aes-256-gcm", key, iv);
        cipher.setAAD(Buffer.from(`site:${outer.id}:response`));
        encryptedResult = {
          iv: iv.toString("base64"),
          ciphertext: Buffer.concat([
            cipher.update(
              JSON.stringify({
                status: 200,
                body: Buffer.from('{"access_token":"issued-token"}').toString(
                  "base64",
                ),
                contentType: "application/json",
              }),
            ),
            cipher.final(),
            cipher.getAuthTag(),
          ]).toString("base64"),
        };
        return new Response("{}", { status: 202 });
      }
      return new Response(
        JSON.stringify({ state: "completed", result: encryptedResult }),
      );
    });
    vi.stubGlobal("fetch", fetch);
    const response = await companyRequest("/platform-auth/login", {
      method: "POST",
      headers: { Authorization: "Bearer owner.token" },
      body: JSON.stringify({ password: "owner-password" }),
    });
    expect(await response.json()).toEqual({ access_token: "issued-token" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("requires site selection and rejects file bodies before dispatch", async () => {
    await expect(companyRequest("/platform-operations", {})).rejects.toThrow(
      "Select a site",
    );
    sessionStorage.setItem(
      "bioems.company.selected-site",
      JSON.stringify({ id: "site", publicKey: {} }),
    );
    await expect(
      companyRequest("/platform-operations", {
        method: "POST",
        body: new Blob(["file"]),
      }),
    ).rejects.toThrow("File transfer");
  });
});
