import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import {
  constants,
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  publicEncrypt,
  randomBytes,
} from "node:crypto";
import { sqlite } from "../../../database/sqlite/client";
import { migration034 } from "../../../database/sqlite/migrations/034_create_company_connection";
import {
  configureConnection,
  connectionStatus,
  disableConnection,
  startCompanyConnection,
} from "./runtime";

vi.mock("../../../database/sqlite/client", async () => {
  const Database = (await import("better-sqlite3")).default;
  return { sqlite: new Database(":memory:") };
});
vi.mock("../../config/config", () => ({
  config: { ownerMfaEncryptionKey: Buffer.alloc(32, 7), apiPrefix: "/api/v1" },
}));
migration034.up(sqlite);
sqlite.exec(
  "CREATE TABLE company_license_snapshot (singleton INTEGER PRIMARY KEY,site_id TEXT,synced_at TEXT,licenses_json TEXT)"
);
const originalFetch = globalThis.fetch;
afterEach(() => {
  disableConnection();
  vi.unstubAllGlobals();
});
describe("opt-in client cloud runtime", () => {
  it("preserves the saved credential only for the same enrolled site and origin", () => {
    const input = {
      url: "https://company.account.workers.dev",
      siteId: "site",
      remoteControl: false,
    };
    expect(() => configureConnection(input)).toThrow();
    configureConnection({ ...input, token: "A".repeat(44) });
    expect(configureConnection({ ...input, viewerMonitoring: true })).toMatchObject({
      enabled: true,
      viewerMonitoring: true,
    });
    expect(connectionStatus()).not.toHaveProperty("token");
    expect(() => configureConnection({ ...input, siteId: "another-site" })).toThrow();
    expect(() =>
      configureConnection({ ...input, url: "https://other.account.workers.dev" })
    ).toThrow();
    expect(() => configureConnection({ ...input, token: "invalid" })).toThrow();
    expect(connectionStatus()).toMatchObject({ siteId: "site", viewerMonitoring: true });
    disableConnection();
    expect(() => configureConnection(input)).toThrow();
  });
  it("starts disabled and persists neither enrollment token nor private key as plaintext", () => {
    expect(connectionStatus().enabled).toBe(false);
    configureConnection({
      url: "https://company.account.workers.dev",
      siteId: "site",
      token: "A".repeat(44),
      remoteControl: false,
    });
    const row = sqlite.prepare("SELECT encrypted_config FROM company_connection").get() as {
      encrypted_config: string;
    };
    expect(row.encrypted_config).not.toContain("A".repeat(44));
    expect(row.encrypted_config).not.toContain("PRIVATE KEY");
    expect(connectionStatus()).toMatchObject({
      enabled: true,
      remoteControl: false,
      siteId: "site",
    });
    expect(connectionStatus()).not.toHaveProperty("token");
  });
  it("rejects non-company origins and leaves local monitoring untouched when disabled", () => {
    for (const url of [
      "http://company.account.workers.dev",
      "https://evil.example",
      "https://company.account.workers.dev/path",
      "https://name:secret@company.account.workers.dev",
    ]) {
      expect(() =>
        configureConnection({ url, siteId: "site", token: "A".repeat(44), remoteControl: false })
      ).toThrow();
    }
    expect(disableConnection()).toMatchObject({ enabled: false });
  });
  it("executes encrypted owner requests through existing HTTP auth and posts encrypted result", async () => {
    const app = express();
    let localCalls = 0,
      resultBody: unknown,
      publicKey: JsonWebKey | undefined;
    app.get("/api/v1/platform-operations", (req, res) => {
      localCalls++;
      if (req.headers.authorization !== "Bearer owner.token") {
        res.status(401).json({ error: "owner auth required" });
        return;
      }
      res.json({ customers: [{ name: "BIO EGYPT" }] });
    });
    let claimed = false,
      key: Buffer | undefined;
    const commandId = "runtime-test-command";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.startsWith("http://127.0.0.1:")) return originalFetch(input, init);
        const data = JSON.parse(init?.body as string) as {
          publicKey?: JsonWebKey;
          result?: { iv: string; ciphertext: string };
        };
        if (url.endsWith("/heartbeat")) {
          publicKey = data.publicKey;
          return new Response(
            JSON.stringify({
              licenseSnapshot: {
                siteId: "site",
                enforcement: false,
                licenses: [
                  {
                    id: "central-license",
                    starts_at: 1,
                    expires_at: 1800000000000,
                    sensor_limit: 7,
                    device_limit: 1,
                    status: "trial",
                  },
                ],
              },
            })
          );
        }
        if (url.endsWith("/claim")) {
          if (claimed) return new Response('{"job":null}');
          claimed = true;
          key = randomBytes(32);
          const iv = randomBytes(12),
            cipher = createCipheriv("aes-256-gcm", key, iv);
          cipher.setAAD(Buffer.from(`site:${commandId}`));
          const envelope = {
            key: publicEncrypt(
              {
                key: createPublicKey({ key: publicKey!, format: "jwk" }),
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
              },
              key
            ).toString("base64"),
            iv: iv.toString("base64"),
            ciphertext: Buffer.concat([
              cipher.update(
                JSON.stringify({
                  path: "/platform-operations",
                  method: "GET",
                  authorization: "Bearer owner.token",
                  expiresAt: Date.now() + 60_000,
                })
              ),
              cipher.final(),
              cipher.getAuthTag(),
            ]).toString("base64"),
          };
          return new Response(
            JSON.stringify({
              job: {
                id: commandId,
                envelope: JSON.stringify(envelope),
                expires_at: Date.now() + 60_000,
              },
            })
          );
        }
        if (url.endsWith("/result")) {
          expect(JSON.stringify(data)).not.toContain("BIO EGYPT");
          const bytes = Buffer.from(data.result!.ciphertext, "base64"),
            decipher = createDecipheriv(
              "aes-256-gcm",
              key!,
              Buffer.from(data.result!.iv, "base64")
            );
          decipher.setAAD(Buffer.from(`site:${commandId}:response`));
          decipher.setAuthTag(bytes.subarray(-16));
          resultBody = JSON.parse(
            Buffer.concat([decipher.update(bytes.subarray(0, -16)), decipher.final()]).toString()
          );
          return new Response("{}");
        }
        throw new Error("Unexpected request");
      })
    );
    startCompanyConnection(app);
    configureConnection({
      url: "https://company.account.workers.dev",
      siteId: "site",
      token: "A".repeat(44),
      remoteControl: true,
    });
    await vi.waitFor(() => expect(resultBody).toBeDefined(), { timeout: 5000 });
    expect(localCalls).toBe(1);
    const snapshot = sqlite.prepare("SELECT licenses_json FROM company_license_snapshot").get() as {
      licenses_json: string;
    };
    expect(JSON.parse(snapshot.licenses_json)).toMatchObject([
      { id: "central-license", sensor_limit: 7 },
    ]);
    expect(resultBody).toMatchObject({ status: 200 });
    const decoded = JSON.parse(
      Buffer.from((resultBody as { body: string }).body, "base64").toString()
    );
    expect(decoded.customers[0].name).toBe("BIO EGYPT");
    expect(
      sqlite
        .prepare("SELECT count(*) AS n FROM company_remote_receipts WHERE command_id=?")
        .get(commandId)
    ).toMatchObject({ n: 1 });
  });
});
