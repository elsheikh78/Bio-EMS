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
  ): NotificationDelivery {
    const uuid = randomUUID();
    this.database
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
    return this.database
      .prepare("SELECT * FROM notification_deliveries WHERE idempotency_key = ?")
      .get(input.idempotency_key) as NotificationDelivery;
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
}
