import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { NotificationEvent, NotificationEventInput } from "./notification-event";

interface NotificationEventRow {
  id: number;
  event_type: NotificationEvent["eventType"];
  source_type: NotificationEvent["sourceType"];
  source_id: string;
  deduplication_key: string;
  payload_json: string;
  occurred_at: string;
  consumed_at: string | null;
  created_at: string;
}

export class NotificationEventRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  enqueue(event: NotificationEventInput): { id: number; created: boolean } {
    const result = this.database
      .prepare(
        `INSERT INTO notification_events (
          event_type, source_type, source_id, deduplication_key, payload_json, occurred_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(deduplication_key) DO NOTHING`
      )
      .run(
        event.eventType,
        event.sourceType,
        event.sourceId,
        event.deduplicationKey,
        JSON.stringify(event.payload),
        event.occurredAt
      );

    if (result.changes === 1) {
      return { id: Number(result.lastInsertRowid), created: true };
    }

    const existing = this.database
      .prepare("SELECT id FROM notification_events WHERE deduplication_key = ?")
      .get(event.deduplicationKey) as { id: number };
    return { id: existing.id, created: false };
  }

  listPending(limit = 100): NotificationEvent[] {
    const rows = this.database
      .prepare(
        `SELECT id, event_type, source_type, source_id, deduplication_key,
                payload_json, occurred_at, consumed_at, created_at
         FROM notification_events
         WHERE consumed_at IS NULL
         ORDER BY id ASC
         LIMIT ?`
      )
      .all(limit) as NotificationEventRow[];
    return rows.map(mapRow);
  }

  markConsumed(id: number, consumedAt: string): boolean {
    return (
      this.database
        .prepare(
          `UPDATE notification_events SET consumed_at = ?
           WHERE id = ? AND consumed_at IS NULL`
        )
        .run(consumedAt, id).changes === 1
    );
  }
}

function mapRow(row: NotificationEventRow): NotificationEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    sourceType: row.source_type,
    sourceId: row.source_id,
    deduplicationKey: row.deduplication_key,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    occurredAt: row.occurred_at,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
  };
}
