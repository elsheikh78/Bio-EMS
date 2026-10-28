# P2-06 — Local Emergency SMS Failover

Status: IMPLEMENTED — CI/merge pending.

## Objective

Provide a deterministic controller-side emergency SMS decision/execution boundary for active CRITICAL alarms while the primary server transport is unavailable, using only the server-owned BF-08 failover configuration.

## Implemented

- Failover is disabled unless `sms_failover.enabled` is true.
- Local SMS is suppressed whenever primary transport is available.
- Primary outage must persist for `primary_unavailable_after_seconds` before local failover becomes eligible.
- Only ACTIVE `CRITICAL_LOW` / `CRITICAL_HIGH` evaluations from P2-05 are eligible.
- BF-08 `critical_escalation_steps` and `sms_targets` determine due recipients.
- Per alarm/step/recipient deterministic idempotency keys suppress duplicate local sends during the controller process lifetime.
- Failed gateway sends remain retryable because the idempotency key is marked sent only after gateway success.
- Primary recovery immediately returns ownership to normal server-side notification delivery.

## Boundaries

This slice does not claim a physical SIM800L implementation, modem AT-command driver, durable idempotency across controller power loss, live carrier delivery, MQTT reconciliation, or field acceptance. Those require later controller integration and P2-09 bench evidence.

## Next

P2-07 — Reconnect Reconciliation.
