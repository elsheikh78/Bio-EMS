import { z } from "zod";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { AppError } from "../../errors/app-error";

export const devicePolicySchema = z
  .object({
    ethernet: z.boolean(),
    wifi: z.boolean(),
    bluetooth: z.boolean(),
    offlineStorage: z.boolean(),
    automaticReplay: z.boolean(),
    powerAlarms: z.boolean(),
    centralBatteryInstalled: z.boolean().default(false),
    storageAlarms: z.boolean(),
    storageWarningPercent: z.number().int().min(50).max(95),
  })
  .strict()
  .refine((p) => p.ethernet || p.wifi || p.bluetooth, {
    message: "At least one communication path must remain enabled",
  })
  .refine((p) => !p.automaticReplay || p.offlineStorage, {
    message: "Automatic replay requires offline storage",
  });
export const platformPolicySchema = z
  .object({
    reports: z.boolean(),
    calibration: z.boolean(),
    notifications: z.boolean(),
    backups: z.boolean(),
    updates: z.boolean(),
  })
  .strict();
export const defaultDevicePolicy = {
  ethernet: true,
  wifi: true,
  bluetooth: true,
  offlineStorage: true,
  automaticReplay: true,
  powerAlarms: true,
  centralBatteryInstalled: false,
  storageAlarms: true,
  storageWarningPercent: 80,
};
export const defaultPlatformPolicy = {
  reports: true,
  calibration: true,
  notifications: true,
  backups: true,
  updates: true,
};
export class FeaturePolicyStore {
  constructor(private readonly db: Database.Database = sqlite) {}
  get(scope: string) {
    const row = this.db
      .prepare("SELECT revision, policy_json FROM feature_policies WHERE scope=?")
      .get(scope) as { revision: number; policy_json: string } | undefined;
    return {
      revision: row?.revision ?? 0,
      policy: row
        ? ({
            ...(scope === "platform" ? defaultPlatformPolicy : defaultDevicePolicy),
            ...JSON.parse(row.policy_json),
          } as Record<string, boolean | number>)
        : { ...(scope === "platform" ? defaultPlatformPolicy : defaultDevicePolicy) },
    };
  }
  save(scope: string, input: unknown, actor: string) {
    const body = z
      .object({
        expectedRevision: z.number().int().nonnegative(),
        policy: z.unknown(),
        reason: z.string().trim().min(3).max(500),
      })
      .strict()
      .parse(input);
    const policy = (scope === "platform" ? platformPolicySchema : devicePolicySchema).parse(
      body.policy
    );
    return this.db.transaction(() => {
      const previous = this.get(scope);
      if (previous.revision !== body.expectedRevision)
        throw new AppError(
          "Settings changed; reload before saving",
          409,
          "FEATURE_POLICY_CONFLICT"
        );
      const revision = previous.revision + 1,
        now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO feature_policies VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(scope) DO UPDATE SET revision=excluded.revision, policy_json=excluded.policy_json,
        updated_at=excluded.updated_at, updated_by=excluded.updated_by`
        )
        .run(scope, revision, JSON.stringify(policy), now, actor);
      this.db
        .prepare(
          `INSERT INTO feature_policy_history
        (scope,revision,previous_json,policy_json,reason,actor,occurred_at) VALUES(?,?,?,?,?,?,?)`
        )
        .run(
          scope,
          revision,
          JSON.stringify(previous.policy),
          JSON.stringify(policy),
          body.reason,
          actor,
          now
        );
      return { revision, policy };
    })();
  }
  enabled(feature: keyof typeof defaultPlatformPolicy): boolean {
    return this.get("platform").policy[feature] !== false;
  }
}
export const featurePolicyStore = new FeaturePolicyStore();
