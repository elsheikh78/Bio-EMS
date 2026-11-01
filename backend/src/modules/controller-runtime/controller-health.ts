import { z } from "zod";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { FeaturePolicyStore } from "./feature-policy";
import { NotificationEventRepository } from "../notification/notification-event.repository";

export const healthSchema = z
  .object({
    timestamp: z.string().datetime(),
    policyError: z.enum(["POLICY_ROLLED_BACK"]).optional(),
    networkSettingsVersion: z.literal(1).optional(),
    appliedRevision: z.number().int().nonnegative(),
    transport: z.enum(["ethernet", "wifi", "bluetooth", "offline"]),
    storage: z.enum(["ready", "missing", "fault", "disabled"]),
    storageUsedPercent: z.number().min(0).max(100).nullable(),
    queued: z.number().int().nonnegative(),
    mains: z.boolean().nullable(),
    batteryLow: z.boolean().nullable(),
  })
  .strict();

export class ControllerHealthService {
  constructor(private readonly db: Database.Database = sqlite) {}
  accept(binding: string, input: unknown) {
    const health = healthSchema.parse(input);
    if (Date.parse(health.timestamp) > Date.now() + 60000)
      throw new Error("Future health timestamp");
    const policy = new FeaturePolicyStore(this.db).get(binding);
    if (health.appliedRevision > policy.revision) throw new Error("Unknown applied revision");
    this.db.transaction(() => {
      const previous = this.db
        .prepare("SELECT health_json FROM controller_health WHERE binding_id=?")
        .get(binding) as { health_json: string } | undefined;
      // Historical status must not overwrite newer state after replay/reconnect.
      if (previous && JSON.parse(previous.health_json).timestamp > health.timestamp) return;
      this.db
        .prepare(
          `INSERT INTO controller_health VALUES(?,?,?,?) ON CONFLICT(binding_id)
        DO UPDATE SET applied_revision=excluded.applied_revision,health_json=excluded.health_json,received_at=excluded.received_at`
        )
        .run(binding, health.appliedRevision, JSON.stringify(health), new Date().toISOString());
      const p = policy.policy;
      const faults: Record<string, boolean | null> = {
        MAINS_LOST:
          p.centralBatteryInstalled && p.powerAlarms
            ? health.mains === null
              ? null
              : !health.mains
            : null,
        BATTERY_LOW: p.centralBatteryInstalled && p.powerAlarms ? health.batteryLow : null,
        SD_UNAVAILABLE:
          p.storageAlarms && p.offlineStorage
            ? health.storage === "missing" || health.storage === "fault"
            : null,
        SD_NEAR_FULL:
          p.storageAlarms && p.offlineStorage
            ? health.storageUsedPercent === null
              ? null
              : health.storageUsedPercent >= Number(p.storageWarningPercent)
            : null,
      };
      const events = new NotificationEventRepository(this.db);
      for (const [code, active] of Object.entries(faults)) {
        if (active === null) continue; // Unknown/disabled does not imply recovery.
        const open = this.db
          .prepare(
            `SELECT id FROM controller_health_alarms WHERE binding_id=? AND code=? AND status!='RECOVERED'`
          )
          .get(binding, code) as { id: number } | undefined;
        if (active && !open) {
          const result = this.db
            .prepare(
              `INSERT INTO controller_health_alarms(binding_id,code,status,trigger_time) VALUES(?,?,'TRIGGERED',?)`
            )
            .run(binding, code, health.timestamp);
          const id = Number(result.lastInsertRowid);
          events.enqueue({
            eventType: "DEVICE_OFFLINE",
            sourceType: "DEVICE",
            sourceId: `health:${id}`,
            deduplicationKey: `health:${id}:triggered`,
            occurredAt: health.timestamp,
            payload: {
              systemHealthId: id,
              bindingId: binding,
              code,
              alarmType: code,
              occurredAt: health.timestamp,
              severity: "CRITICAL",
              priority: "HIGHEST",
            },
          });
        } else if (!active && open) {
          this.db
            .prepare(
              "UPDATE controller_health_alarms SET status='RECOVERED',recovered_at=? WHERE id=?"
            )
            .run(health.timestamp, open.id);
        }
      }
    })();
    return policy;
  }
}
