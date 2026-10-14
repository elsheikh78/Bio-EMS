import {
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { z } from "zod";
import type { Express } from "express";
import type { Server } from "node:http";
import { sqlite } from "../../../database/sqlite/client";
import { config } from "../../config/config";
import { operationalSummary } from "./summary";
import { decryptRemoteRequest, encryptRemoteResult, type CloudEnvelope } from "./protocol";

interface Connection {
  url: string;
  siteId: string;
  token: string;
  remoteControl: boolean;
  privateKey: string;
  publicKey: Record<string, unknown>;
}
let application: Express | undefined;
let localServer: Server | undefined;
let localUrl = "";
let timer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
let lastSuccess: string | null = null;
let lastError: string | null = null;
let heartbeatAt = 0;
function storageKey() {
  if (!config.ownerMfaEncryptionKey)
    throw new Error("Owner encryption key is required for cloud connection");
  return Buffer.from(
    hkdfSync(
      "sha256",
      config.ownerMfaEncryptionKey,
      Buffer.alloc(0),
      "BIOEMS:COMPANY-CONNECTION:v1",
      32
    )
  );
}
function load(): Connection | undefined {
  const row = sqlite
    .prepare("SELECT encrypted_config FROM company_connection WHERE singleton=1")
    .get() as { encrypted_config: string } | undefined;
  if (!row) return undefined;
  const [iv, tag, data] = row.encrypted_config.split(".");
  const decipher = createDecipheriv("aes-256-gcm", storageKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(
    Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
  ) as Connection;
}
export function connectionStatus() {
  const current = load();
  return {
    enabled: !!current,
    url: current?.url,
    siteId: current?.siteId,
    remoteControl: current?.remoteControl || false,
    lastSuccess,
    lastError,
  };
}
export function configureConnection(input: {
  url: string;
  siteId: string;
  token: string;
  remoteControl: boolean;
}) {
  const url = new URL(input.url);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.workers\.dev$/.test(url.hostname)
  )
    throw new Error("Use the company workers.dev HTTPS origin");
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(input.siteId) || !/^[a-zA-Z0-9+/=]{40,64}$/.test(input.token))
    throw new Error("Invalid site connection details");
  storageKey();
  const current = load();
  const keys =
    current && current.siteId === input.siteId && current.url === url.origin
      ? { privateKey: current.privateKey, publicKey: current.publicKey }
      : (() => {
          const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
          return {
            privateKey: pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
            publicKey: pair.publicKey.export({ format: "jwk" }) as Record<string, unknown>,
          };
        })();
  const connection: Connection = { ...input, url: url.origin, ...keys };
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", storageKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(connection)), cipher.final()]);
  sqlite
    .prepare(
      "INSERT INTO company_connection VALUES (1,?) ON CONFLICT(singleton) DO UPDATE SET encrypted_config=excluded.encrypted_config"
    )
    .run(
      [iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(
        "."
      )
    );
  if (!current || current.siteId !== connection.siteId || current.url !== connection.url)
    sqlite.prepare("DELETE FROM company_license_snapshot").run();
  restart();
  return connectionStatus();
}
export function disableConnection() {
  sqlite.prepare("DELETE FROM company_license_snapshot").run();
  sqlite.prepare("DELETE FROM company_connection").run();
  generation++;
  if (timer) clearTimeout(timer);
  localServer?.close();
  localServer = undefined;
  localUrl = "";
  lastSuccess = null;
  lastError = null;
  return connectionStatus();
}
async function cloud(connection: Connection, action: string, data: unknown) {
  const response = await fetch(`${connection.url}/api/agent/${connection.siteId}/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${connection.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Cloud HTTP ${response.status}`);
  return response.json() as Promise<{
    licenseSnapshot?: unknown;
    job?: { id: string; envelope: string; expires_at: number } | null;
  }>;
}
async function execute(
  connection: Connection,
  job: { id: string; envelope: string; expires_at: number }
) {
  const aad = `${connection.siteId}:${job.id}`;
  const { key, request } = decryptRemoteRequest(
    JSON.parse(job.envelope) as CloudEnvelope,
    connection.privateKey,
    aad
  );
  if (job.expires_at < Date.now()) return;
  const consumed = sqlite
    .prepare("INSERT OR IGNORE INTO company_remote_receipts VALUES (?,?)")
    .run(job.id, Date.now());
  if (consumed.changes !== 1) return;
  let result: { status: number; body: string; contentType: string };
  try {
    const response = await fetch(`${localUrl}${config.apiPrefix}${request.path}`, {
      method: request.method,
      headers: {
        ...(request.authorization ? { Authorization: request.authorization } : {}),
        "Content-Type": "application/json",
      },
      body: request.method === "GET" ? undefined : request.body,
      signal: AbortSignal.timeout(45_000),
      redirect: "error",
    });
    const reader = response.body?.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > 250_000) {
          await reader.cancel();
          throw new Error("Remote response exceeds pilot limit");
        }
        chunks.push(Buffer.from(next.value));
      }
    }
    const bytes = Buffer.concat(chunks);
    result = {
      status: response.status,
      body: Buffer.from(bytes).toString("base64"),
      contentType: response.headers.get("Content-Type") || "application/json",
    };
  } catch {
    result = {
      status: 502,
      body: Buffer.from(
        JSON.stringify({
          error: {
            code: "REMOTE_RESULT_UNKNOWN",
            message: "Execution may have started. Check local state before retrying.",
          },
        })
      ).toString("base64"),
      contentType: "application/json",
    };
  }
  await cloud(connection, "result", { id: job.id, result: encryptRemoteResult(result, key, aad) });
}
async function tick(currentGeneration: number) {
  const connection = load();
  if (!connection || currentGeneration !== generation) return;
  try {
    if (Date.now() - heartbeatAt >= 60_000) {
      sqlite
        .prepare("DELETE FROM company_remote_receipts WHERE consumed_at<?")
        .run(Date.now() - 86_400_000);
      let summary: ReturnType<typeof operationalSummary> | null = null;
      try {
        summary = operationalSummary(sqlite);
      } catch {
        /* Report unavailable rather than a false healthy zero. */
      }
      const response = await cloud(connection, "heartbeat", {
        summary,
        publicKey: connection.publicKey,
        status: "UP",
        version: process.env.BIOEMS_PRODUCT_VERSION || "0.20.0",
        uptime: Math.floor(process.uptime()),
        remoteControl: connection.remoteControl,
      });
      if (currentGeneration !== generation) return;
      if (response.licenseSnapshot !== undefined) {
        const snapshot = z
          .object({
            siteId: z.literal(connection.siteId),
            enforcement: z.literal(false),
            licenses: z
              .array(
                z.object({
                  id: z.string().min(1).max(64),
                  starts_at: z.number().int().nonnegative(),
                  expires_at: z.number().int().nonnegative(),
                  sensor_limit: z.number().int().nonnegative(),
                  device_limit: z.number().int().nonnegative(),
                  status: z.enum(["trial", "active", "suspended"]),
                })
              )
              .max(1000),
          })
          .parse(response.licenseSnapshot);
        sqlite
          .prepare(
            `INSERT INTO company_license_snapshot VALUES (1,?,?,?)
          ON CONFLICT(singleton) DO UPDATE SET site_id=excluded.site_id,
          synced_at=excluded.synced_at,licenses_json=excluded.licenses_json`
          )
          .run(connection.siteId, new Date().toISOString(), JSON.stringify(snapshot.licenses));
      }
      heartbeatAt = Date.now();
      lastSuccess = new Date().toISOString();
      lastError = null;
    }
    if (connection.remoteControl && currentGeneration === generation) {
      const result = await cloud(connection, "claim", {});
      if (result.job && currentGeneration === generation) await execute(connection, result.job);
    }
  } catch (error) {
    lastError =
      error instanceof Error && /^Cloud HTTP \d+$/.test(error.message)
        ? error.message
        : "Cloud connection failed";
  }
  if (currentGeneration === generation) {
    timer = setTimeout(
      () => void tick(currentGeneration),
      connection.remoteControl ? 15_000 : 60_000
    );
    timer.unref();
  }
}
function restart() {
  generation++;
  if (timer) clearTimeout(timer);
  heartbeatAt = 0;
  const current = load();
  if (!application || !current) return;
  const currentGeneration = generation;
  if (localServer) {
    void tick(currentGeneration);
    return;
  }
  // Optional internal listener is loopback-only. Existing owner auth/MFA middleware still applies.
  localServer = application.listen(0, "127.0.0.1", () => {
    const address = localServer?.address();
    if (address && typeof address !== "string") localUrl = `http://127.0.0.1:${address.port}`;
    void tick(currentGeneration);
  });
  localServer.unref();
}
export function startCompanyConnection(app: Express) {
  application = app;
  try {
    restart();
  } catch {
    lastError = "Cloud configuration could not be loaded";
  }
}
