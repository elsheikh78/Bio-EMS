import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import { sqlite } from "../../../database/sqlite/client";
import { config } from "../../config/config";
import { AppError } from "../../errors/app-error";
import { FeaturePolicyStore } from "./feature-policy";

const credentialsSchema = z
  .object({
    ssid: z
      .string()
      .min(1)
      .refine(
        (v) =>
          Buffer.byteLength(v, "utf8") <= 32 &&
          !Array.from(v).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)
      ),
    password: z
      .string()
      .min(8)
      .max(63)
      .regex(/^[\x20-\x7e]+$/),
  })
  .strict();
export const networkSettingsSchema = z
  .object({
    expectedRevision: z.number().int().nonnegative(),
    ethernet: z.boolean(),
    wifi: z.boolean(),
    bluetooth: z.boolean(),
    centralBatteryInstalled: z.boolean(),
    wifiCredentials: credentialsSchema.optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .strict()
  .refine((v) => v.ethernet || v.wifi || v.bluetooth, "Keep at least one connection enabled");

type Credentials = z.infer<typeof credentialsSchema>;
export class NetworkSettingsStore {
  constructor(
    private readonly db: Database.Database = sqlite,
    private readonly key = config.communicationConfigEncryptionKey
  ) {}
  private cryptKey() {
    if (!this.key)
      throw new AppError("Installation encryption key is required", 503, "NETWORK_KEY_UNAVAILABLE");
    return this.key;
  }
  credentials(binding: string): Credentials | undefined {
    const row = this.db
      .prepare("SELECT encrypted FROM controller_network_credentials WHERE binding_id=?")
      .get(binding) as { encrypted: string } | undefined;
    if (!row) return undefined;
    const [iv, tag, data] = row.encrypted.split(".").map((v) => Buffer.from(v, "base64"));
    const cipher = createDecipheriv("aes-256-gcm", this.cryptKey(), iv);
    cipher.setAAD(Buffer.from(`BIOEMS:MAIN-WIFI:v1:${binding}`));
    cipher.setAuthTag(tag);
    return credentialsSchema.parse(
      JSON.parse(Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8"))
    );
  }
  get(binding: string) {
    const saved = new FeaturePolicyStore(this.db).get(binding);
    const row = this.db
      .prepare(
        "SELECT applied_revision,health_json,received_at FROM controller_health WHERE binding_id=?"
      )
      .get(binding) as
      { applied_revision: number; health_json: string; received_at: string } | undefined;
    const health = row ? JSON.parse(row.health_json) : null;
    const credentials = this.credentials(binding);
    return {
      revision: saved.revision,
      appliedRevision: row?.applied_revision ?? null,
      policy: {
        ethernet: saved.policy.ethernet,
        wifi: saved.policy.wifi,
        bluetooth: saved.policy.bluetooth,
        centralBatteryInstalled: saved.policy.centralBatteryInstalled,
      },
      ssid: credentials?.ssid ?? "",
      passwordConfigured: !!credentials,
      networkSettingsVersion: health?.networkSettingsVersion ?? 0,
      transport: health?.transport ?? "unknown",
      policyError: health?.policyError ?? null,
      receivedAt: row?.received_at ?? null,
    };
  }
  save(binding: string, input: unknown, actor: string) {
    const body = networkSettingsSchema.parse(input);
    return this.db.transaction(() => {
      const state = this.get(binding);
      if (state.networkSettingsVersion !== 1)
        throw new AppError(
          "Upgrade Main firmware and wait for health before changing network settings",
          409,
          "MAIN_NETWORK_UPGRADE_REQUIRED"
        );
      const store = new FeaturePolicyStore(this.db);
      const previous = store.get(binding);
      // Full policy and its revision are shared with owner settings: admin changes only this allowlist.
      store.save(
        binding,
        {
          expectedRevision: body.expectedRevision,
          policy: {
            ...previous.policy,
            ethernet: body.ethernet,
            wifi: body.wifi,
            bluetooth: body.bluetooth,
            centralBatteryInstalled: body.centralBatteryInstalled,
          },
          reason: body.reason,
        },
        actor
      );
      if (body.wifiCredentials) {
        const iv = randomBytes(12),
          cipher = createCipheriv("aes-256-gcm", this.cryptKey(), iv);
        cipher.setAAD(Buffer.from(`BIOEMS:MAIN-WIFI:v1:${binding}`));
        const data = Buffer.concat([
          cipher.update(JSON.stringify(body.wifiCredentials)),
          cipher.final(),
        ]);
        const encrypted = [iv, cipher.getAuthTag(), data]
          .map((v) => v.toString("base64"))
          .join(".");
        this.db
          .prepare(
            `INSERT INTO controller_network_credentials VALUES(?,?,?) ON CONFLICT(binding_id)
          DO UPDATE SET encrypted=excluded.encrypted,updated_at=excluded.updated_at`
          )
          .run(binding, encrypted, new Date().toISOString());
      }
      return this.get(binding);
    })();
  }
}
