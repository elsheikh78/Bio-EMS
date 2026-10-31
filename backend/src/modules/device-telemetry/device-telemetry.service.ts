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
    sampleId: z
      .string()
      .regex(/^[a-f0-9-]{16,80}$/)
      .optional(),
    signal: z.number().finite().optional(),
    timestamp: z.string().datetime().optional(),
    mode: z.enum(["LIVE", "REPLAY"]).optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.mode === "REPLAY" && !payload.timestamp)
      ctx.addIssue({
        code: "custom",
        path: ["timestamp"],
        message: "Replay requires original timestamp",
      });
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
    return this.acceptDigest(
      bindingId,
      createHash("sha256").update(token).digest("hex"),
      body,
      /^[a-f0-9]{64}$/.test(token)
    );
  }

  async acceptDigest(
    bindingId: string,
    digestHex: string,
    body: unknown,
    valid = true
  ): Promise<boolean> {
    if (
      !valid ||
      !/^[a-f0-9]{64}$/.test(digestHex) ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(bindingId)
    )
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
    const digest = Buffer.from(digestHex, "hex");
    const expected = Buffer.from(row.tokenHash, "hex");
    if (expected.length !== digest.length || !timingSafeEqual(expected, digest)) return false;
    const parsed = readingSchema.parse(body);
    if (parsed.timestamp && new Date(parsed.timestamp).getTime() > this.now().getTime() + 60_000)
      throw new Error("Telemetry timestamp is in the future");
    const canonical = { ...parsed, mode: undefined };
    const payloadHash = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
    if (parsed.sampleId) {
      const receipt = this.database
        .prepare(
          "SELECT payload_hash FROM controller_ingress_receipts WHERE binding_id=? AND sample_id=?"
        )
        .get(bindingId, parsed.sampleId) as { payload_hash: string } | undefined;
      if (receipt) {
        if (receipt.payload_hash !== payloadHash)
          throw new Error("Sample ID reused with different data");
        return true;
      }
    }
    const telemetry =
      this.telemetry ??
      new (await import("../telemetry/services/telemetry.service")).TelemetryService();
    const accepted = await telemetry.process(`bioems/${row.siteCode}/telemetry/${row.deviceId}`, {
      protocolVersion: row.protocolVersion,
      timestamp: parsed.timestamp ?? this.now().toISOString(),
      mode: parsed.mode ?? "LIVE",
      signal: parsed.signal ?? 0,
      platformBindingId: row.bindingId,
      hardwareUid: row.hardwareUid,
      sensors: parsed.sensors,
    });
    if (accepted && parsed.sampleId)
      this.database
        .prepare(
          `INSERT INTO controller_ingress_receipts
      VALUES(?,?,?,?) ON CONFLICT(binding_id,sample_id) DO NOTHING`
        )
        .run(bindingId, parsed.sampleId, payloadHash, this.now().toISOString());
    return accepted;
  }
}

export const deviceTelemetryService = new DeviceTelemetryService();
