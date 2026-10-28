# BIO EGYPT Pilot — Commissioning and Acceptance Record

## Record header

| Field                  | Entry               |
| ---------------------- | ------------------- |
| Site                   | TBD — Commissioning |
| Survey revision        | TBD — Commissioning |
| As-built revision      | TBD — Commissioning |
| Controller ID/serial   | TBD — Commissioning |
| Platform build/version | TBD — Commissioning |
| Commissioning date     | TBD — Commissioning |
| BIO-EMS engineer       | TBD — Commissioning |
| Customer witness       | TBD — Customer      |

## Gate 1 — Document and installation readiness

- [ ] Controlled scope and latest Sensor map approved.
- [ ] Open-item register contains no blocking item.
- [ ] Controller and Sensor hardware match the approved bill of materials.
- [ ] Calibration evidence is valid and linked to each Sensor serial.
- [ ] As-built routes, lengths, labels, terminations, and photographs are complete.
- [ ] Power, earthing/protection, network, time synchronization, and site permissions
      are verified.

## Gate 2 — Configuration identity

For every mapped Sensor, witness and record:

- [ ] Site, Monitored Area, Device, channel, Map ID, and serial are unique and match.
- [ ] Sensor type/unit, enabled state, product grade, model, installation date, and
      calibration metadata are correct.
- [ ] Warning and Alarm thresholds match the customer-approved requirement.
- [ ] Device is activated at the correct Site and rejects a mismatched Site/topic.

Attach the completed 20-row Sensor map with final Device/channel and serial values.

## Gate 3 — End-to-end functional tests

| Test                  | Expected evidence                                             | Result |
| --------------------- | ------------------------------------------------------------- | ------ |
| Normal telemetry      | Trusted reading appears against the correct Sensor            | TBD    |
| Each channel identity | Stimulated Sensor maps only to its assigned channel           | TBD    |
| Warning threshold     | Correct warning state; no SMS failover                        | TBD    |
| Critical threshold    | Correct critical Alarm and notification event                 | TBD    |
| Alarm recovery        | Recovery recorded without emergency SMS                       | TBD    |
| Alarm acknowledgment  | Authorized actor and timestamp recorded                       | TBD    |
| Heartbeat             | Device becomes online with trusted server receipt time        | TBD    |
| Stale boundary        | Device becomes stale after approved S15-03 threshold          | TBD    |
| Offline boundary      | Device becomes offline and emits approved transition evidence | TBD    |
| Site mismatch         | Telemetry/heartbeat rejected without downstream side effects  | TBD    |
| Disabled Sensor       | Channel rejected without telemetry/Alarm write                | TBD    |
| Restart/reconnect     | Service resumes without duplicate identities/events           | TBD    |

## Gate 4 — Communication-loss and SMS contract tests

- [ ] Primary communication available: no SMS for any event.
- [ ] Primary communication unavailable: warning/recovery/acknowledgment/stale/online
      events do not send SMS.
- [ ] Backend Device-offline scenario uses one stable failover identity.
- [ ] Site Controller local critical-Alarm scenario is demonstrated or formally
      deferred as a blocking hardware/firmware item.
- [ ] Only approved E.164 test recipient is used; no number or credential is committed
      to source control.
- [ ] Gateway/provider failure is reported without sensitive-detail leakage.
- [ ] Repeated processing does not create duplicate emergency messages.

## Gate 5 — Operational handover

- [ ] Named customer ADMIN and OPERATOR access verified.
- [ ] Customer knows normal Alarm, acknowledgment, Device-health, and failover meaning.
- [ ] Calibration, backup, restore, incident, support, and escalation contacts supplied.
- [ ] Known limitations and deferred items accepted in writing.
- [ ] Final evidence pack stored under the agreed controlled-document process.

## Acceptance decision

| Decision                                     | Select |
| -------------------------------------------- | ------ |
| Accepted                                     | [ ]    |
| Accepted with listed non-blocking deviations | [ ]    |
| Rejected / blocking rework required          | [ ]    |

BIO-EMS representative: ____________________ Date: __________

BIO EGYPT representative: __________________ Date: __________

No Pilot is accepted while a blocking item remains open or required evidence is
missing.
