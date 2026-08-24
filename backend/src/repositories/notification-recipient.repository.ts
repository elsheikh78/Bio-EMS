import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import {
  CreateNotificationRecipientInput,
  NotificationRecipientEndpointInput,
  UpdateNotificationRecipientInput,
} from "../modules/notification/dto/notification-recipient.schema";

export interface NotificationRecipientEndpoint extends NotificationRecipientEndpointInput {
  id: number;
}
export interface NotificationRecipient {
  id: number;
  uuid: string;
  site_id: number;
  display_name: string;
  role: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string | null;
  endpoints: NotificationRecipientEndpoint[];
}

type RecipientRow = Omit<NotificationRecipient, "endpoints">;
type EndpointRow = Omit<NotificationRecipientEndpoint, "eligible_severities"> & {
  eligible_severities_json: string;
};

export class NotificationRecipientRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(input: CreateNotificationRecipientInput): NotificationRecipient {
    const result = this.database
      .prepare(
        `INSERT INTO notification_recipients (uuid, site_id, display_name, role)
         VALUES (?, ?, ?, ?)`
      )
      .run(input.uuid, input.site_id, input.display_name, input.role);
    this.replaceEndpoints(Number(result.lastInsertRowid), input.endpoints);
    return this.findByUuid(input.uuid)!;
  }

  findByUuid(uuid: string): NotificationRecipient | undefined {
    const row = this.database
      .prepare("SELECT * FROM notification_recipients WHERE uuid = ? LIMIT 1")
      .get(uuid) as RecipientRow | undefined;
    return row ? { ...row, endpoints: this.endpoints(row.id) } : undefined;
  }

  listBySite(siteId: number): NotificationRecipient[] {
    return (
      this.database
        .prepare("SELECT * FROM notification_recipients WHERE site_id = ? ORDER BY id")
        .all(siteId) as RecipientRow[]
    ).map((row) => ({ ...row, endpoints: this.endpoints(row.id) }));
  }

  update(uuid: string, input: UpdateNotificationRecipientInput): NotificationRecipient | undefined {
    const current = this.findByUuid(uuid);
    if (!current) return undefined;
    this.database
      .prepare(
        `UPDATE notification_recipients
         SET display_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`
      )
      .run(input.display_name ?? current.display_name, input.role ?? current.role, uuid);
    if (input.endpoints) this.replaceEndpoints(current.id, input.endpoints);
    return this.findByUuid(uuid);
  }

  updateStatus(uuid: string, status: "active" | "inactive"): NotificationRecipient | undefined {
    const result = this.database
      .prepare(
        `UPDATE notification_recipients SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`
      )
      .run(status, uuid);
    return result.changes === 0 ? undefined : this.findByUuid(uuid);
  }

  resolveEligible(
    siteId: number,
    channel: string,
    severity: "WARNING" | "CRITICAL"
  ): NotificationRecipient[] {
    const rows = this.database
      .prepare(
        `SELECT DISTINCT recipients.*
         FROM notification_recipients recipients
         INNER JOIN notification_recipient_endpoints endpoints
           ON endpoints.recipient_id = recipients.id
         WHERE recipients.site_id = ? AND recipients.status = 'active'
           AND endpoints.channel = ?
           AND EXISTS (
             SELECT 1 FROM json_each(endpoints.eligible_severities_json) WHERE value = ?
           )
         ORDER BY recipients.id`
      )
      .all(siteId, channel, severity) as RecipientRow[];
    return rows.map((row) => ({ ...row, endpoints: this.endpoints(row.id) }));
  }

  private replaceEndpoints(
    recipientId: number,
    endpoints: NotificationRecipientEndpointInput[]
  ): void {
    this.database
      .prepare("DELETE FROM notification_recipient_endpoints WHERE recipient_id = ?")
      .run(recipientId);
    const insert = this.database.prepare(
      `INSERT INTO notification_recipient_endpoints
         (recipient_id, channel, address, eligible_severities_json)
       VALUES (?, ?, ?, ?)`
    );
    for (const endpoint of endpoints) {
      const severities = ["WARNING", "CRITICAL"].filter((severity) =>
        endpoint.eligible_severities.includes(severity as "WARNING" | "CRITICAL")
      );
      insert.run(recipientId, endpoint.channel, endpoint.address, JSON.stringify(severities));
    }
  }

  private endpoints(recipientId: number): NotificationRecipientEndpoint[] {
    return (
      this.database
        .prepare(
          `SELECT id, channel, address, eligible_severities_json
         FROM notification_recipient_endpoints WHERE recipient_id = ? ORDER BY id`
        )
        .all(recipientId) as EndpointRow[]
    ).map(({ eligible_severities_json, ...row }) => ({
      ...row,
      eligible_severities: JSON.parse(eligible_severities_json) as Array<"WARNING" | "CRITICAL">,
    }));
  }
}
