import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import {
  acknowledgedConfigIdentitySchema,
  type AcknowledgedConfigIdentity,
} from "./runtime.contract";

const DURABLE_CONFIG_RECORD_VERSION = 1 as const;

const durableConfigPayloadSchema = z
  .object({
    record_version: z.literal(DURABLE_CONFIG_RECORD_VERSION),
    controller_id: z.string().trim().min(1).max(100),
    config: acknowledgedConfigIdentitySchema,
    persisted_at: z.string().datetime({ offset: true }),
  })
  .strict();

const durableConfigRecordSchema = z
  .object({
    payload: durableConfigPayloadSchema,
    integrity_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

type DurableConfigPayload = z.infer<typeof durableConfigPayloadSchema>;
type DurableConfigRecord = z.infer<typeof durableConfigRecordSchema>;

export interface DurableConfigStore {
  load(controllerId: string, siteUuid: string): AcknowledgedConfigIdentity | null;
  save(controllerId: string, config: AcknowledgedConfigIdentity, persistedAt: string): void;
}

export class FileDurableConfigStore implements DurableConfigStore {
  constructor(private readonly filePath: string) {}

  load(controllerId: string, siteUuid: string): AcknowledgedConfigIdentity | null {
    let raw: string;
    try {
      raw = readFileSync(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }

    let record: DurableConfigRecord;
    try {
      record = durableConfigRecordSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }

    if (record.integrity_sha256 !== checksum(record.payload)) return null;
    if (record.payload.controller_id !== controllerId) return null;
    if (record.payload.config.site_uuid !== siteUuid) return null;
    return structuredClone(record.payload.config);
  }

  save(controllerId: string, config: AcknowledgedConfigIdentity, persistedAt: string): void {
    const payload = durableConfigPayloadSchema.parse({
      record_version: DURABLE_CONFIG_RECORD_VERSION,
      controller_id: controllerId,
      config,
      persisted_at: persistedAt,
    });
    const record: DurableConfigRecord = {
      payload,
      integrity_sha256: checksum(payload),
    };

    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.filePath);
  }
}

function checksum(payload: DurableConfigPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
