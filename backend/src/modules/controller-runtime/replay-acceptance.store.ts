import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

const REPLAY_LEDGER_VERSION = 1 as const;
const replayIdSchema = z.string().regex(/^[a-f0-9]{64}$/);
const payloadSchema = z
  .object({
    record_version: z.literal(REPLAY_LEDGER_VERSION),
    replay_ids: z.array(replayIdSchema),
  })
  .strict();
const recordSchema = z
  .object({
    payload: payloadSchema,
    integrity_sha256: replayIdSchema,
  })
  .strict();

type ReplayLedgerPayload = z.infer<typeof payloadSchema>;

export interface ReplayAcceptanceStore {
  load(): string[];
  save(replayIds: string[]): void;
}

export class FileReplayAcceptanceStore implements ReplayAcceptanceStore {
  constructor(private readonly filePath: string) {}

  load(): string[] {
    let raw: string;
    try {
      raw = readFileSync(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }

    try {
      const record = recordSchema.parse(JSON.parse(raw));
      if (record.integrity_sha256 !== checksum(record.payload)) return [];
      return [...new Set(record.payload.replay_ids)].sort();
    } catch {
      return [];
    }
  }

  save(replayIds: string[]): void {
    const payload = payloadSchema.parse({
      record_version: REPLAY_LEDGER_VERSION,
      replay_ids: [...new Set(replayIds)].sort(),
    });
    const record = { payload, integrity_sha256: checksum(payload) };
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.filePath);
  }
}

function checksum(payload: ReplayLedgerPayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
