import type Database from "better-sqlite3";
import { sqlite } from "../../../database/sqlite/client";
import { EscalationPolicyRepository } from "../../repositories/escalation-policy.repository";
import { NotificationRecipientRepository } from "../../repositories/notification-recipient.repository";
import { NotificationDeliveryRepository } from "./notification-delivery.repository";
import { NotificationEventRepository } from "./notification-event.repository";

interface AlarmContext {
  status: string;
  severity: "WARNING" | "CRITICAL";
  siteId: number;
}

export class NotificationEscalationOrchestrator {
  constructor(
    private readonly database: Database.Database = sqlite,
    private readonly events = new NotificationEventRepository(database),
    private readonly deliveries = new NotificationDeliveryRepository(database),
    private readonly policies = new EscalationPolicyRepository(database),
    private readonly recipients = new NotificationRecipientRepository(database)
  ) {}

  tick(now = new Date()): number {
    let created = 0;
    for (const event of this.events.listPending(100)) {
      if (event.sourceType !== "ALARM") continue;
      if (event.eventType === "ALARM_ACKNOWLEDGED" || event.eventType === "ALARM_RECOVERED") {
        this.deliveries.cancelOpenForSource("ALARM", event.sourceId, now.toISOString());
        this.consumeAlarmEvents(event.sourceId, now.toISOString());
        continue;
      }
      if (event.eventType !== "ALARM_TRIGGERED") continue;
      const context = this.alarmContext(Number(event.sourceId));
      if (!context || context.status !== "TRIGGERED") {
        this.deliveries.cancelOpenForSource("ALARM", event.sourceId, now.toISOString());
        this.events.markConsumed(event.id, now.toISOString());
        continue;
      }
      const elapsed = Math.max(
        0,
        Math.floor((now.getTime() - new Date(event.occurredAt).getTime()) / 1000)
      );
      for (const policy of this.policies.resolveDue(context.siteId, context.severity, elapsed)) {
        for (const step of policy.steps) {
          for (const channel of step.channels) {
            const eligible = this.recipients
              .resolveEligible(context.siteId, channel, context.severity)
              .filter((recipient) => recipient.role === step.recipient_role);
            for (const recipient of eligible) {
              const value = this.deliveries.create({
                notification_event_id: event.id,
                site_id: context.siteId,
                recipient_id: recipient.id,
                channel: channel as "EMAIL" | "SMS" | "WHATSAPP",
                severity: context.severity,
                idempotency_key: `delivery:${event.id}:${policy.id}:${step.position}:${recipient.id}:${channel}`,
              });
              if (value.created) created += 1;
            }
          }
        }
      }
    }
    return created;
  }

  private alarmContext(alarmId: number): AlarmContext | undefined {
    return this.database
      .prepare(
        `SELECT alarms.status, alarms.severity, rooms.site_id AS siteId
      FROM alarms INNER JOIN sensors ON sensors.id = alarms.sensor_id
      INNER JOIN rooms ON rooms.id = sensors.room_id WHERE alarms.id = ?`
      )
      .get(alarmId) as AlarmContext | undefined;
  }

  private consumeAlarmEvents(sourceId: string, now: string) {
    this.database
      .prepare(
        `UPDATE notification_events SET consumed_at = ?
      WHERE source_type = 'ALARM' AND source_id = ? AND consumed_at IS NULL`
      )
      .run(now, sourceId);
  }
}
