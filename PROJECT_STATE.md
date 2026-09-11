# BIO-EMS Project State

**State date:** 11 September 2026  
**Authoritative main audited:** `af9a69963d091eda6a16bee17f69a94d912136d6`  
**Current source-software version:** `0.20.0`  
**Latest published source release:** `v0.20.0`

## Current phase

**PILOT STABILIZATION / QUALIFICATION.**

Source software is mature and full CI is green, but the BIO EGYPT Pilot is still **NOT COMMISSIONED / NOT ACCEPTED**. The next controlled priority is not final commercial protection. The immediate sequence is:

1. implement COM-01 -> COM-06;
2. build a fresh Pilot Setup;
3. qualify the installer on multiple clean Windows targets;
4. execute hardware/bench qualification;
5. close required live notification/failover evidence;
6. perform BIO EGYPT field commissioning/UAT;
7. stabilize defects;
8. then implement/qualify deferred final Device Trust/commercial protection.

Master audit:
`docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`.

## Repository / CI baseline

- Current authoritative `main`: `af9a69963d091eda6a16bee17f69a94d912136d6`.
- PR #205: Communication Channel Administration plan merged.
- Latest full CI used in the audit:
  - Backend: typecheck/build/lint/format passed; 114 test files / 809 tests passed.
  - Frontend: typecheck/lint/format/build passed; 52 test files / 299 tests passed.
- No new product version/release is created by this audit.

## Established software baseline

The following remain established source baselines:

- P0-P7 source/product closure.
- P8-02 through P8-08 source closure.
- Arabic/English localization and RTL/LTR navigation.
- UX-01 through UX-09 product refresh.
- Dashboard, Monitored Areas and Live Board telemetry refresh/reconnect behavior.
- Alarm acknowledgment-to-recovery correction.
- Recipient Directory and Escalation Policy configuration.
- Durable notification delivery architecture.
- Email and Telegram live Critical Alarm delivery evidence.
- LIC-01 through LIC-13 previously merged source work.
- DEP-01-01 through DEP-01-05 source work.

Historical closure remains historical evidence and must not be rewritten to imply current field acceptance.

## Notification position

### Proven

- Email live delivery passed.
- Telegram live delivery passed.
- End-to-end Critical Alarm -> Email + Telegram path passed.
- Recipients/Escalation Policies are application-managed.

### Planned / open

- COM-01 through COM-07: **APPROVED / PLANNED**.
- Meta WhatsApp live acceptance: **OPEN / externally blocked**.
- SMS/GSM live delivery: **OPEN**.
- Telegram remains the approved interim online channel while WhatsApp is blocked.

Authority:
`docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md`.

## Windows Setup position

Installer progress after PRs #199-#203:

- PR #199: repeatable GitHub Actions single-EXE internal Setup artifact.
- PR #200: internal build-scoped Authenticode signing for BIO EGYPT Pilot artifacts.
- PR #201: one-click elevated Pilot launcher with certificate trust and signature check.
- PR #202: automatic Pilot installation diagnostic log.
- PR #203: correction for clean-device/partial-install service-installation failure path.

Therefore the installer is no longer “not implemented.”

**Still open:**

- post-PR-203 Fresh Install evidence on a clean machine;
- three BIO-EMS services installed and running;
- HTTPS/frontend/API health;
- reboot recovery;
- Repair/Upgrade/rollback;
- retained-data Uninstall;
- repeatability on more than one clean Windows PC;
- final supported-Windows declaration;
- public/commercial Authenticode decision;
- Production Installer publication.

The development workstation must not be used as a clean target when an unrelated Mosquitto service is present.

## Communication Channel Administration

Status: **COM-01 THROUGH COM-07 PLANNED / NOT YET IMPLEMENTED OR QUALIFIED**.

Required sequence:

- COM-01 secure provider configuration storage.
- COM-02 RBAC-protected API.
- COM-03 provider runtime integration.
- COM-04 bilingual Communication Channels UI.
- COM-05 safe test actions/diagnostics.
- COM-06 channel priority/failover and regression.
- COM-07 Pilot acceptance.

## Hardware / field position

Hardware remains a separate evidence track.

Open:

- Pilot controller BOM freeze;
- sensor/controller bench validation;
- device/Site/Area/Sensor mapping with physical hardware;
- real telemetry/reconnect/buffering/replay;
- power/reboot tests;
- live SMS/GSM fallback;
- endurance/72-hour evidence where applicable;
- calibration evidence;
- BIO EGYPT physical installation;
- commissioning and customer acceptance.

## Security / commercial protection position

Approved architecture remains authoritative:

- `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`
- `docs/security/device-registration.md`
- `docs/security/activation-workflow.md`

However, the latest product decision is to **defer final protection/device-trust implementation until Pilot Setup and hardware are stable**.

In particular, DEV-TRUST-01 through DEV-TRUST-11 remain planned architecture/work packages, not current Pilot implementation evidence.

This does not delete earlier licensing source work; it separates existing source controls from the later production-grade device PKI, mTLS, Secure Boot/Flash Encryption, host-transfer and commercial qualification layer.

## Release position

- Product source authority: `VERSION = 0.20.0`.
- Backend package: `0.20.0`.
- Published GitHub source release: `v0.20.0`.
- `release-manifest.json`: `0.20.0`.
- No new release/version until a deliberate release decision after the next software milestone.

## Current execution order

1. COM-01 -> COM-06 source implementation and CI.
2. Build fresh controlled Pilot Setup.
3. Multi-machine clean Windows qualification.
4. COM-07 live Pilot acceptance.
5. Hardware integration/bench qualification.
6. Live SMS/GSM fallback evidence; continue WhatsApp work in parallel but do not block the interim Telegram Pilot path.
7. BIO EGYPT installation/calibration/commissioning/UAT.
8. Pilot stabilization/fixes.
9. DEV-TRUST-01 -> DEV-TRUST-11 and final commercial protection.
10. Public/commercial signing, final Production Installer, production manuals/presentation/release.

## Evidence rule

Repository/CI success, installer qualification, provider acceptance, hardware validation, field commissioning, UAT and commercial-production readiness are separate gates.

A source merge must never be represented as field acceptance, and an approved architecture must never be represented as implemented capability.
