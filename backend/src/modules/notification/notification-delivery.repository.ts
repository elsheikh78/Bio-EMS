import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { sqlite } from "../../../database/sqlite/client";

export type DeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "RETRY_WAIT"
  | "FAILED"
  | "DEAD_LETTER"
  | "CANCELLED";

export interface NotificationDelivery {
  id: number;
  uuid: string;
  notification_event_id: number;
  site_id: number;
  recipient_id: number;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  severity: "WARNING" | "CRITICAL";
  status: DeliveryStatus;
  idempotency_key: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  claimed_at: string | null;
  claim_token: string | null;
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  last_error_code: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DeliveryEnvelope {
  delivery: NotificationDelivery;
  recipient: string;
  payload: Record<string, unknown>;
}

export interface NotificationDeliveryView extends NotificationDelivery {
  recipient_name: string;
  recipient_role: string;
  event_type: string;
  source_id: string;
  attempts: Array<{
    id: number;
    attempt_number: number;
    phase: "START" | "RESULT";
    status: string;
    provider: string;
    provider_message_id: string | null;
    error_code: string | null;
    started_at: string;
    completed_at: string | null;
  }>;
}

export class NotificationDeliveryRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(
    input: Pick<
      NotificationDelivery,
      | "notification_event_id"
      | "site_id"
      | "recipient_id"
      | "channel"
      | "severity"
      | "idempotency_key"
    >
  ): NotificationDelivery & { created: boolean } {
    const uuid = randomUUID();
    const result = this.database
      .prepare(
        `INSERT INTO notification_deliveries
      (uuid, notification_event_id, site_id, recipient_id, channel, severity, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING`
      )
      .run(
        uuid,
        input.notification_event_id,
        input.site_id,
        input.recipient_id,
        input.channel,
        input.severity,
        input.idempotency_key
      );
    const value = this.database
      .prepare("SELECT * FROM notification_deliveries WHERE idempotency_key = ?")
      .get(input.idempotency_key) as NotificationDelivery;
    return { ...value, created: result.changes === 1 };
  }

  claimDue(now: string, staleBefore: string): NotificationDelivery | undefined {
    return this.database.transaction(() => {
      const row = this.database
        .prepare(
          `SELECT * FROM notification_deliveries
        WHERE ((status IN ('PENDING','RETRY_WAIT') AND next_attempt_at <= ?)
          OR (status = 'PROCESSING' AND claimed_at < ?))
        ORDER BY next_attempt_at, id LIMIT 1`
        )
        .get(now, staleBefore) as NotificationDelivery | undefined;
      if (!row) return undefined;
      const token = randomUUID();
      const changed = this.database
        .prepare(
          `UPDATE notification_deliveries
        SET status = 'PROCESSING', claimed_at = ?, claim_token = ?, updated_at = ?
        WHERE id = ? AND status = ?`
        )
        .run(now, token, now, row.id, row.status).changes;
      return changed
        ? { ...row, status: "PROCESSING" as const, claimed_at: now, claim_token: token }
        : undefined;
    })();
  }

  recordFailure(
    id: number,
    claimToken: string,
    now: string,
    errorCode: string,
    retryAt: string
  ): boolean {
    const row = this.database
      .prepare(
        "SELECT attempt_count, max_attempts FROM notification_deliveries WHERE id = ? AND claim_token = ?"
      )
      .get(id, claimToken) as { attempt_count: number; max_attempts: number } | undefined;
    if (!row) return false;
    const attempt = row.attempt_count + 1;
    const terminal = attempt >= row.max_attempts;
    return (
      this.database
        .prepare(
          `UPDATE notification_deliveries SET status = ?, attempt_count = ?,
      next_attempt_at = ?, failed_at = ?, last_error_code = ?, claim_token = NULL,
      claimed_at = NULL, updated_at = ? WHERE id = ? AND claim_token = ?`
        )
        .run(
          terminal ? "DEAD_LETTER" : "RETRY_WAIT",
          attempt,
          retryAt,
          terminal ? now : null,
          errorCode,
          now,
          id,
          claimToken
        ).changes === 1
    );
  }

  recordSent(id: number, claimToken: string, now: string, providerMessageId: string): boolean {
    return (
      this.database
        .prepare(
          `UPDATE notification_deliveries SET status = 'SENT',
      attempt_count = attempt_count + 1, provider_message_id = ?, sent_at = ?,
      claim_token = NULL, claimed_at = NULL, last_error_code = NULL, updated_at = ?
      WHERE id = ? AND claim_token = ?`
        )
        .run(providerMessageId, now, now, id, claimToken).changes === 1
    );
  }

  listBySite(siteId: number, limit = 200): NotificationDelivery[] {
    return this.database
      .prepare(
        `SELECT * FROM notification_deliveries WHERE site_id = ?
      ORDER BY id DESC LIMIT ?`
      )
      .all(siteId, limit) as NotificationDelivery[];
  }

  listDetailedBySite(
    siteId: number,
    limit = 200,
    status?: DeliveryStatus
  ): NotificationDeliveryView[] {
    const rows = this.database
      .prepare(
        `SELECT deliveries.*, recipients.display_name AS recipient_name,
          recipients.role AS recipient_role, events.event_type, events.source_id
        FROM notification_deliveries deliveries
        INNER JOIN notification_recipients recipients ON recipients.id = deliveries.recipient_id
        INNER JOIN notification_events events ON events.id = deliveries.notification_event_id
        WHERE deliveries.site_id = ? AND (? IS NULL OR deliveries.status = ?)
        ORDER BY deliveries.id DESC LIMIT ?`
      )
      .all(siteId, status ?? null, status ?? null, limit) as Omit<
      NotificationDeliveryView,
      "attempts"
    >[];
    const attempts = this.database.prepare(
      `SELECT id, attempt_number, phase, status, provider, provider_message_id,
        error_code, started_at, completed_at
      FROM notification_delivery_attempts WHERE delivery_id = ? ORDER BY id`
    );
    return rows.map((row) => ({
      ...row,
      attempts: attempts.all(row.id),
    })) as NotificationDeliveryView[];
  }

  cancelOpenForSource(sourceType: "ALARM" | "DEVICE", sourceId: string, now: string): number {
    return this.database
      .prepare(
        `UPDATE notification_deliveries SET status = 'CANCELLED',
      claim_token = NULL, claimed_at = NULL, updated_at = ?
      WHERE status IN ('PENDING','RETRY_WAIT','PROCESSING') AND notification_event_id IN
        (SELECT id FROM notification_events WHERE source_type = ? AND source_id = ?)`
      )
      .run(now, sourceType, sourceId).changes;
  }

  envelope(delivery: NotificationDelivery): DeliveryEnvelope | undefined {
    const row = this.database
      .prepare(
        `SELECT endpoints.address, events.payload_json
      FROM notification_recipient_endpoints endpoints
      INNER JOIN notification_events events ON events.id = ?
      WHERE endpoints.recipient_id = ? AND endpoints.channel = ? LIMIT 1`
      )
      .get(delivery.notification_event_id, delivery.recipient_id, delivery.channel) as
      { address: string; payload_json: string } | undefined;
    return row
      ? { delivery, recipient: row.address, payload: JSON.parse(row.payload_json) }
      : undefined;
  }

  startAttempt(deliveryId: number, attemptNumber: number, provider: string, now: string): number {
    return Number(
      this.database
        .prepare(
          `INSERT INTO notification_delivery_attempts
      (delivery_id, attempt_number, phase, status, provider, started_at)
      VALUES (?, ?, 'START', 'STARTED', ?, ?)`
        )
        .run(deliveryId, attemptNumber, provider, now).lastInsertRowid
    );
  }

  finishAttempt(
    attemptId: number,
    status: "SENT" | "DELIVERED" | "FAILED" | "TIMEOUT",
    now: string,
    providerMessageId?: string,
    errorCode?: string
  ): void {
    this.database
      .prepare(
        `INSERT INTO notification_delivery_attempts
      (delivery_id, attempt_number, phase, status, provider, provider_message_id, error_code, started_at, completed_at)
      SELECT delivery_id, attempt_number, 'RESULT', ?, provider, ?, ?, started_at, ?
      FROM notification_delivery_attempts WHERE id = ?`
      )
      .run(status, providerMessageId ?? null, errorCode ?? null, now, attemptId);
  }
}
