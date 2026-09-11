# BIO-EMS Pilot Scope

**Scope date:** 11 September 2026  
**Status:** CONTROLLED PILOT SCOPE / NOT YET COMMISSIONED

## Pilot objective

Demonstrate that BIO-EMS can be installed repeatably on a customer Windows computer, receive real environmental telemetry, generate correct Alarms, notify authorized recipients, survive normal operational interruptions and support controlled commissioning.

## Customer / Sites

BIO EGYPT Pilot:

- El Manial.
- CPC / 6th October.

Phase 1 monitoring is temperature-focused.

## In scope

### Software

- current BIO-EMS source baseline;
- Arabic/English UI;
- Dashboard, Monitored Areas and Live Monitoring Wall;
- Alarms and acknowledgment/recovery;
- calibration;
- reports;
- Users/RBAC;
- Notification Recipients;
- Escalation Policies;
- Communication Channel Administration after COM implementation;
- installer/repair/upgrade/uninstall lifecycle needed for Pilot operation.

### Notifications

- Email;
- Telegram as the interim online Pilot channel;
- SMS/GSM fallback after live qualification;
- WhatsApp configuration/source may be present, but live acceptance is not a Pilot blocker while Meta onboarding remains externally blocked.

### Hardware

- approved Pilot Site Controller direction;
- approved Pilot temperature Sensors;
- real Site/Area/Sensor mapping;
- power/network/reconnect testing;
- local buffering/replay where supported;
- SMS/GSM fallback hardware/transport where selected.

## Out of immediate Pilot critical path

The following are approved future production requirements but are not allowed to block early Pilot stabilization:

- production Device PKI/mTLS;
- final Secure Boot / Flash Encryption lock-down;
- final commercial clone-detection implementation;
- public/commercial Authenticode signing;
- final production licensing/host-transfer qualification.

These return after the Pilot software/hardware path is stable.

## Pilot acceptance gates

1. COM source implementation passes CI.
2. Fresh Pilot Setup installs on clean Windows.
3. BIO-EMS services recover after reboot.
4. HTTPS/frontend/API health passes.
5. Setup is repeatable on more than one machine.
6. Real Sensors publish stable telemetry.
7. Alarm challenge tests pass.
8. Email/Telegram delivery passes in Pilot environment.
9. Required SMS/GSM fallback passes.
10. Calibration evidence exists.
11. Field commissioning is recorded.
12. Customer ADMIN completes UAT/acceptance.
13. No Severity-1 Pilot blocker remains.

## Pilot is not production

Pilot acceptance does not equal commercial production readiness. Production additionally requires the deferred security/protection, signing, DR and final Production Installer gates.
