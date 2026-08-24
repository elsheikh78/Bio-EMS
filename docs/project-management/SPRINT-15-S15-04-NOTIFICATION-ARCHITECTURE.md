# Sprint 15 — S15-04 Notification Architecture

## Objective

Create a durable, channel-independent notification boundary driven by Alarm and
Device communication events without selecting or implementing Email, WhatsApp,
Push, or SMS delivery.

## Event contract

The approved event vocabulary is:

- `ALARM_TRIGGERED`;
- `ALARM_RECOVERED`;
- `ALARM_ACKNOWLEDGED`;
- `DEVICE_STALE`;
- `DEVICE_OFFLINE`;
- `DEVICE_ONLINE`.

Every event carries its type, source type and identity, a stable deduplication key,
structured JSON payload, authoritative occurrence time, and persistence timestamps.
The contract contains no channel-specific recipient, provider, template, or retry
field.

## Durable boundary

Migration 008 creates `notification_events` as a durable FIFO outbox. A unique
deduplication key makes producer retries idempotent. Consumers can list pending
events in insertion order and mark each event consumed exactly once.

Alarm creation, recovery, and acknowledgment publish their matching event inside
the same SQLite transaction as the Alarm state mutation. If event persistence fails,
the Alarm mutation rolls back rather than leaving an unnotifiable state transition.

The notification service also exposes typed Device `STALE`, `OFFLINE`, and `ONLINE`
transition producers. S15-04 deliberately does not emit those events from a health
read: communication health is derived at read time, and reads must remain free of
side effects. A later approved transition detector or scheduling worker can call the
contract without changing channel adapters.

## Delivery boundary

`NotificationChannelAdapter` defines the future asynchronous delivery seam. No
adapter is registered in S15-04, so the durable event outbox cannot accidentally send
external messages before recipient policy and provider behavior are approved.

BF-06 subsequently adds a separate Site-scoped recipient directory and
Warning/Critical eligibility resolver. It does not change the durable event payload,
consume this outbox, or register a delivery adapter. Contact addresses remain outside
events and deduplication keys.

## Scope boundaries

- No SMS provider or failover logic; S15-05 owns that contract.
- No Email, WhatsApp, Push, webhook, or external network delivery.
- S15-04 itself included no recipient directory; BF-06 now supplies that separate
  backend foundation. Escalation timing, template rendering, and frontend remain out
  of scope.
- No communication polling/scheduling worker.
- No changes to Device health thresholds, Sensor Alarm evaluation, authentication,
  authorization policy, or published REST contracts.

## Verification

Coverage includes migration ordering/idempotency, fresh and upgraded schemas,
event persistence and payload restoration, retry deduplication, FIFO pending reads,
single-consumption semantics, Alarm event mapping, Device transition mapping,
timestamp rejection, transactional Alarm integration, and preserved Alarm state
contracts.
