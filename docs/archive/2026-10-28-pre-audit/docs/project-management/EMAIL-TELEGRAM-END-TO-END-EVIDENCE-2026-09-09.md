# BIO-EMS Email and Telegram End-to-End Alarm Delivery Evidence

**Evidence date:** 9 September 2026  
**Environment:** Local Windows development workstation / BIO EGYPT controlled test data  
**Source baseline:** `dcc7f228356a93b1f02de555ea4cabdb9b14f7bd` (`main` at test start)  
**Software version:** `0.20.0`

## Result

**PASSED — LIVE END-TO-END EVIDENCE CAPTURED**

A real MQTT telemetry message was accepted for the active device and enabled temperature Sensor. The value exceeded the configured critical-high threshold, created a `HIGH_TEMPERATURE` Critical Alarm, and produced durable Email and Telegram delivery jobs. Both providers reported `SENT` on their first attempt, and the operator confirmed actual receipt in both destinations.

## Verified path

1. Backend connected to the local Mosquitto broker and subscribed to `bioems/+/telemetry/+`.
2. MQTT telemetry was published to the Site/device topic using a JSON file to preserve valid quoting on Windows.
3. The Backend accepted Site `SITE001`, Device `ESP32-0001`, Sensor channel `1`, and value `10 °C`.
4. The telemetry point was written successfully to InfluxDB.
5. Alarm `#9` was created as `CRITICAL / TRIGGERED` with type `HIGH_TEMPERATURE`.
6. The active Site-scoped Critical escalation step resolved recipient `Ahmed` through notification role `MANAGEMENT`.
7. Two durable delivery jobs were created:
   - `EMAIL` — `SENT`, attempt `1/5`;
   - `TELEGRAM` — `SENT`, attempt `1/5`.
8. The operator confirmed actual receipt of both Email and Telegram messages.

## Configuration correction established during evidence

The first orchestration attempt created no delivery jobs because the escalation step used `PRIMARY_CONTACT` while the configured recipient used `MANAGEMENT`. This was a configuration mismatch, not a provider failure. The controlled correction is:

- Warning policy: Warning eligibility only; recipient role `MANAGEMENT`; Email and Telegram channels.
- Critical policy: Critical eligibility only; recipient role `MANAGEMENT`; Email and Telegram channels.
- Recipient: active, Site-scoped, role `MANAGEMENT`, eligible for the selected severities.
- First escalation delay: 60 seconds.

User-account RBAC roles and notification-recipient roles are distinct domains; an application User role does not replace escalation recipient-role matching.

## Acknowledgment and recovery lifecycle evidence

The same live Alarm exposed a lifecycle gap: after acknowledgment, a normal reading did not initially recover the Alarm because repository open/recovery predicates recognized only `TRIGGERED`. PR #196 corrected the open lifecycle to include both `TRIGGERED` and `ACKNOWLEDGED` until recovery.

Verification after merge `13635eb9304b6c6daf3652d2ac055e1498bb2537`:

1. Alarm `#9` had been acknowledged after successful Email and Telegram delivery.
2. A valid normal telemetry reading of `5 °C` was accepted for the same Sensor.
3. Alarm `#9` transitioned from `ACKNOWLEDGED` to `RECOVERED`.
4. The History summary changed from 7 acknowledged / 2 recovered to 6 acknowledged / 3 recovered.
5. Active and Critical counts remained zero.
6. Repository regression coverage verifies that an acknowledged Alarm remains open, does not create a duplicate lifecycle, recovers on a normal reading, and preserves its acknowledgment timestamp/user evidence.

**Result:** PASSED — live acknowledgment-to-recovery behavior verified after PR #196 / CI #680.

## Security and evidence boundaries

- No Telegram bot token, Chat ID, Email address, SMTP password, provider secret, or message body containing personal data is recorded here.
- Provider secrets remain local deployment configuration and must not be committed.
- This evidence closes Email and Telegram live end-to-end acceptance for this controlled local alarm path.
- It does not establish WhatsApp acceptance, SMS live delivery, physical controller qualification, production installer qualification, field Commissioning, customer UAT, or production acceptance.