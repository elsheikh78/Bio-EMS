import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import { AuditEvent, AuditEventInput } from "../entities/AuditEvent";

interface PersistAuditEventInput extends AuditEventInput {
  id: string;
  occurredAt: string;
}

interface AuditEventRow {
  id: string;
  occurred_at: string;
  actor_kind: AuditEvent["actor"]["kind"];
  actor_id: string;
  actor_username: string;
  actor_role: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  site_id: number | null;
  result: AuditEvent["result"];
  previous_values_json: string | null;
  new_values_json: string | null;
  request_id: string | null;
  session_id: string | null;
  correlation_id: string | null;
  reason: string | null;
  source_context: string;
  created_at: string;
}

export interface AuditEventListQuery {
  siteId?: number;
  limit: number;
}

const SELECT_COLUMNS = `
  id, occurred_at, actor_kind, actor_id, actor_username, actor_role, action,
  target_type, target_id, site_id, result, previous_values_json, new_values_json,
  request_id, session_id, correlation_id, reason, source_context, created_at
`;

export class AuditEventRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  append(event: PersistAuditEventInput): AuditEvent {
    this.database
      .prepare(
        `INSERT INTO audit_events (
          id, occurred_at, actor_kind, actor_id, actor_username, actor_role, action,
          target_type, target_id, site_id, result, previous_values_json, new_values_json,
          request_id, session_id, correlation_id, reason, source_context
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        event.id,
        event.occurredAt,
        event.actor.kind,
        event.actor.id,
        event.actor.username,
        event.actor.role,
        event.action,
        event.target?.type ?? null,
        event.target?.id ?? null,
        event.siteId ?? null,
        event.result,
        serialize(event.previousValues),
        serialize(event.newValues),
        event.requestContext.requestId ?? null,
        event.requestContext.sessionId ?? null,
        event.requestContext.correlationId ?? null,
        event.reason ?? null,
        event.requestContext.source
      );

    return this.findById(event.id)!;
  }

  findById(id: string): AuditEvent | undefined {
    const row = this.database
      .prepare(`SELECT ${SELECT_COLUMNS} FROM audit_events WHERE id = ? LIMIT 1`)
      .get(id) as AuditEventRow | undefined;
    return row ? mapRow(row) : undefined;
  }

  list(query: AuditEventListQuery): AuditEvent[] {
    const where = query.siteId === undefined ? "" : "WHERE site_id = ?";
    const parameters = query.siteId === undefined ? [query.limit] : [query.siteId, query.limit];
    const rows = this.database
      .prepare(
        `SELECT ${SELECT_COLUMNS}
         FROM audit_events
         ${where}
         ORDER BY occurred_at DESC, id DESC
         LIMIT ?`
      )
      .all(...parameters) as AuditEventRow[];
    return rows.map(mapRow);
  }
}

function serialize(values: Record<string, unknown> | undefined): string | null {
  return values === undefined ? null : JSON.stringify(values);
}

function mapRow(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    actor: {
      kind: row.actor_kind,
      id: row.actor_id,
      username: row.actor_username,
      role: row.actor_role,
    },
    action: row.action,
    target:
      row.target_type && row.target_id ? { type: row.target_type, id: row.target_id } : undefined,
    siteId: row.site_id ?? undefined,
    result: row.result,
    previousValues: parseValues(row.previous_values_json),
    newValues: parseValues(row.new_values_json),
    requestContext: {
      requestId: row.request_id ?? undefined,
      sessionId: row.session_id ?? undefined,
      correlationId: row.correlation_id ?? undefined,
      source: row.source_context,
    },
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  };
}

function parseValues(value: string | null): Record<string, unknown> | undefined {
  return value === null ? undefined : (JSON.parse(value) as Record<string, unknown>);
}
