import { createHash, timingSafeEqual } from "node:crypto";
import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { z } from "zod";
import type { TelemetryService } from "../telemetry/services/telemetry.service";

const readingSchema = z
  .object({
    sensors: z
      .array(
        z
          .object({
            channel: z.number().int().min(1).max(16),
            value: z.number().finite().min(-100).max(150),
          })
          .strict()
      )
      .min(1)
      .max(16),
    signal: z.number().finite().optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const channels = new Set<number>();
    for (const [index, sensor] of payload.sensors.entries()) {
      if (channels.has(sensor.channel))
        ctx.addIssue({
          code: "custom",
          path: ["sensors", index, "channel"],
          message: "Duplicate channel",
        });
      channels.add(sensor.channel);
    }
  });

export class DeviceTelemetryService {
  constructor(
    private readonly database: Database.Database = sqlite,
    private readonly telemetry: Pick<TelemetryService, "process"> | null = null,
    private readonly now: () => Date = () => new Date()
  ) {}

  async accept(bindingId: string, token: string, body: unknown): Promise<boolean> {
    if (!/^[a-f0-9]{64}$/.test(token) || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(bindingId))
      return false;
    const row = this.database
      .prepare(
        `SELECT platform_binding_id AS bindingId,
      telemetry_token_hash AS tokenHash, hardware_uid AS hardwareUid,
      protocol_version AS protocolVersion, site_code AS siteCode,
      device_identity AS deviceId FROM device_platform_bindings
      WHERE platform_binding_id=? AND status='ACTIVE'`
      )
      .get(bindingId) as
      | {
          bindingId: string;
          tokenHash: string | null;
          hardwareUid: string;
          protocolVersion: string;
          siteCode: string;
          deviceId: string;
        }
      | undefined;
    if (!row?.tokenHash) return false;
    const digest = createHash("sha256").update(token).digest();
    const expected = Buffer.from(row.tokenHash, "hex");
    if (expected.length !== digest.length || !timingSafeEqual(expected, digest)) return false;
    const parsed = readingSchema.parse(body);
    const telemetry =
      this.telemetry ??
      new (await import("../telemetry/services/telemetry.service")).TelemetryService();
    await telemetry.process(`bioems/${row.siteCode}/telemetry/${row.deviceId}`, {
      protocolVersion: row.protocolVersion,
      timestamp: this.now().toISOString(),
      signal: parsed.signal ?? 0,
      platformBindingId: row.bindingId,
      hardwareUid: row.hardwareUid,
      sensors: parsed.sensors,
    });
    return true;
  }
}

export const deviceTelemetryService = new DeviceTelemetryService();
