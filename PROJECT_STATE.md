# BIO-EMS Project State

**State date:** 21 September 2026  
**Authoritative main audited:** `653a573584122a2fa72e4e762d8f0337ae0f6712`  
**Current integration branch:** `feat/dep-br-backup-restore` / draft PR #239  
**Current source-software version:** `0.20.0`  
**Latest published source release:** `v0.20.0`

## 21 September physical Repair checkpoint

- Physical Repair on the same legacy Pilot host now passes end to end while preserving the existing BIO-EMS state.
- The repaired lifecycle handles protected legacy MQTT `mosquitto.db` ACLs and no longer mistakes successful non-zero `robocopy` result codes for health failures. The recovered health evidence passed every service, HTTPS, InfluxDB, MQTT, frontend and firewall check.
- A clean machine can no longer continue through `Reinstall / Repair`: interactive and silent Repair require both the registered BIO-EMS installation and controlled services. Clean and partial-state hosts are directed to controlled `New Install` instead of producing a false-success incomplete installation.
- Regression coverage enforces the Repair precondition. CI and Internal Windows Setup must pass on the formatted guard commit before a replacement Pilot artifact is accepted.
- PR #239 remains unmerged until the remaining physical acceptance gates pass.
- The application now exposes **Backup & Restore** to customer ADMIN users and a corresponding System Owner module. Both provide on-demand complete backup and controlled restore; System Owner additionally receives the disaster-recovery identity-transfer path.
- Optional automatic complete backups are source implemented with durable settings for every 6 hours, 12 hours, 24 hours or 7 days, configurable retention from 1 to 30 backups, next/last-run evidence and recorded failure status. Manual backup remains independently available.
- Backend and frontend quality gates passed for this source implementation. Physical browser exercise of manual backup, scheduled execution, retention and restore remains an open acceptance gate.

## 19 September integration checkpoint

- PR #239 is the current stacked integration line and contains the work carried forward from PRs #233, #235 and #237 plus DEP-BR.
- Manufacturer owner key fingerprint is verified as `495ae8e780a32b671518f06a371612b884327e899b67ca0483a21813be50fb81`; the repository trust keyring matches it and an automated fingerprint test is present.
- Physical New Install reached healthy services/HTTPS and ADMIN login. A stale cached customer login shell was reproduced at bare `/login`; cache-busted navigation loaded the current UI. A cache revalidation fix is under CI/Windows verification and requires physical retest without `?fresh` or hard refresh.
- Physical SEC-OWNER commissioning, MFA enrollment/login, Repair preservation, and Backup/Restore historical telemetry acceptance remain open. PR #239 must remain unmerged until those gates pass.
- PR #138 is stale/conflicted documentation and is not an authoritative merge candidate.

## Current phase

**PILOT STABILIZATION / QUALIFICATION.**

Source software is mature and full CI is green, but the BIO EGYPT Pilot is still **NOT COMMISSIONED / NOT ACCEPTED**. The next controlled priority is not final commercial protection. The immediate sequence is:

1. retain SEC-OWNER-01 as implemented/verified Pilot source pending Production key ceremony and acceptance;
2. retain COM-01 -> COM-06 as source implemented on PR #235;
3. execute COM-07 live provider/hardware acceptance;
4. continue multi-machine Windows installer qualification;
5. execute hardware/bench qualification;
6. perform BIO EGYPT field commissioning/UAT;
7. stabilize defects;
8. then complete deferred final Device Trust/commercial protection.

Master audit:
`docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`.

## Repository / CI baseline

- Current authoritative `main`: `653a573584122a2fa72e4e762d8f0337ae0f6712` (PR #231 merged: customer ADMIN provisioning during Setup).
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

- COM-01 through COM-06: **SOURCE IMPLEMENTED / VERIFIED ON PR #235; NOT MERGED TO MAIN**.
- COM-07: **LIVE ACCEPTANCE PENDING**.
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

**Updated evidence / still open:**

- Clean Windows automated Pilot Setup/install health is verified on the current integration line (PR #235, Internal Windows Setup run #330).
- A separate 16 September clean-install exercise from commit `e48bba4` verified the three BIO-EMS services Running, successful customer ADMIN login, and no automatic SYSTEM_OWNER creation.
- Still open: reboot recovery evidence, Repair/Upgrade/rollback, retained-data Uninstall acceptance, repeatability on an additional clean physical PC, and final Production signing/publication.

## Communication Channel Administration

Status: **COM-01 THROUGH COM-06 SOURCE IMPLEMENTED / COM-07 LIVE ACCEPTANCE PENDING**.

Current evidence:
- PR #235 carries COM-01 through COM-06 on top of SEC-OWNER integration work.
- CI run #1021 passed.
- Internal Windows Setup run #330 passed, including locked vendor acquisition, deterministic staging, signing/signature verification, installation and Pilot health.
- COM-07 remains open for real Email/Telegram/WhatsApp/SMS and local modem/SIM evidence where applicable.

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


## 16 September 2026 integration update

- SEC-OWNER-01: implementation complete on PR #233; Pilot CI/Windows evidence exists; Production merge/acceptance remains gated by the real manufacturer Ed25519 public keyring, offline private-key commissioning exercise and Production security review.
- Customer ADMIN bootstrap: merged to main in PR #231 and additionally validated in a clean Pilot installation.
- COM-01 through COM-06: source implemented on draft PR #235; COM-07 external/live acceptance remains pending.
- Documentation sync commit on the integration branch records the 16 September Pilot Admin/Installer validation without storing any credential secret.
- BIO EGYPT remains NOT COMMISSIONED / NOT ACCEPTED.
