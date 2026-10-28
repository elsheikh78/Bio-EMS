# Sprint 15 — S15-05 SMS Failover Contract

## Objective

Define and test emergency SMS behavior for loss of primary Internet communication
without making SMS the normal notification channel or selecting a provider before
Pilot deployment configuration is approved.

## Approved decision table

| Primary communication | Event                                      | SMS decision  |
| --------------------- | ------------------------------------------ | ------------- |
| Available             | Any event                                  | Never use SMS |
| Unavailable           | `ALARM_TRIGGERED` with `CRITICAL` severity | Eligible      |
| Unavailable           | `DEVICE_OFFLINE` transition                | Eligible      |
| Unavailable           | Warning Alarm                              | Not eligible  |
| Unavailable           | Alarm recovery or acknowledgment           | Not eligible  |
| Unavailable           | Device stale or online transition          | Not eligible  |

The policy is failover-only. Provider delivery failure while primary communication
is available does not silently reclassify SMS as the normal channel.

## Two execution locations

### Backend offline detection

After the S15-03 offline threshold is crossed and an approved transition detector
publishes `DEVICE_OFFLINE`, the backend can apply this contract and send one emergency
SMS through a future gateway adapter.

### Site Controller local critical Alarm

When the Site Controller knows its primary Internet path is unavailable, it must
evaluate configured critical thresholds locally and apply the same decision table.
This is required because a critical reading created during a site outage cannot reach
the backend in time to trigger a backend SMS.

The controller must use one stable event/deduplication identity per Alarm episode and
store-and-forward telemetry after reconnection. Firmware implementation and field
validation remain deployment work; the shared backend contract is the normative
software behavior.

## Provider-neutral contract

`SmsFailoverGateway` receives the semantic notification event, an E.164 recipient,
and a stable idempotency key. `SmsFailoverService`:

- evaluates eligibility before validating or contacting a gateway;
- rejects eligible requests without an E.164 recipient;
- preserves one idempotency key across retries without embedding the phone number;
- returns provider-neutral `SENT`, `FAILED`, or `NOT_ELIGIBLE` outcomes;
- does not expose provider error details.

Recipient resolution, message rendering/localization, retry scheduling, rate limits,
credentials, and delivery-receipt persistence belong to the future concrete adapter
and deployment configuration.

## Scope boundaries

- No real SMS, SIM, modem, HTTP provider, or provider SDK integration.
- No phone numbers, credentials, or customer recipients stored in source control.
- No automatic retry worker, escalation schedule, or repeated SMS loop.
- No replacement for primary WhatsApp/online notifications.
- No frontend screen, REST contract, or authorization-policy change.
- No Device health threshold or Alarm Engine change.

## Verification

Coverage exercises the complete decision table, gateway suppression for ineligible
events, E.164 fail-closed validation, stable retry idempotency, successful receipts,
and sanitized provider failure behavior.
