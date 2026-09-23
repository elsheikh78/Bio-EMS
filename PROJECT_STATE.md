# BIO-EMS Project State

**State date:** 23 September 2026  
**Authoritative main audited:** `6d2b25ef35f48d5a87df0f2073e46cddd6deca48`  
**Current integration branch:** none; `main` is authoritative  
**Current source-software version:** `0.20.0`  
**Latest published source release:** `v0.20.0`

## 23 September SYSTEM_OWNER physical Pilot checkpoint

- The manufacturer-controlled SYSTEM_OWNER path has now been exercised end to end on the installed Windows Pilot host: commissioning request -> company-side signing -> signed package import -> isolated owner creation -> MFA enrollment -> MFA activation -> MFA-protected login -> protected System Owner console.
- The final browser session reached `https://localhost/system-owner` and was signed in as `system-owner`.
- Read-only database evidence after activation confirmed an active owner principal, an enabled MFA timestamp, stored encrypted MFA state and no lockout.
- Physical troubleshooting exposed and closed four concrete defects through PRs #248-#251: installed Node runtime discovery, protected `backend.env` loading for owner-package import, controlled MFA enrollment-token handoff, and safe resume of pending MFA enrollment after short-lived token expiry.
- Final merged fixes are represented by main commit `6d2b25ef35f48d5a87df0f2073e46cddd6deca48`.
- PR #251 CI passed and Internal Windows Setup run `35855353686` passed the signed Pilot Setup/build/install/health workflow.
- Evidence record: `docs/project-management/SYSTEM-OWNER-E2E-PILOT-ACCEPTANCE-2026-09-23.md`.
- This closes the immediate Pilot-host SYSTEM_OWNER commissioning/MFA/login verification item only. COM-07, multi-machine qualification, hardware validation, BIO EGYPT field commissioning/UAT, Production security acceptance and final commercial protection remain open.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## 22 September integration and repository checkpoint

- PR #239 is merged to `main`, integrating SYSTEM_OWNER security, managed communication channels, password recovery, installation lifecycle and verified platform backup/restore.
- PR #240 is merged to `main`, correcting Windows/Linux portability assumptions in the backend test suite without changing production runtime behavior.
- Current Windows verification passed the full Backend suite: 137 test files / 965 tests, plus typecheck, lint and format checks.
- PR #240 CI and Internal Windows Setup both passed before merge.
- Repository hygiene audit found 257 branches at audit start. Historical branch cleanup is tracked by `docs/project-management/REPOSITORY-CLEANUP-2026-09-22.md`.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**; source integration does not replace physical commissioning/UAT evidence.

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

1. verify the merged Communication Channels administration on current `main`;
2. execute COM-07 live provider/hardware acceptance;
3. continue multi-machine Windows installer and Backup/Restore qualification;
4. execute hardware/bench qualification;
5. perform BIO EGYPT field commissioning/UAT;
6. stabilize defects;
7. then complete deferred final Device Trust/commercial protection.

Master audit:
`docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`.

## Repository / CI baseline

- Current authoritative `main`: `6d2b25ef35f48d5a87df0f2073e46cddd6deca48` (SYSTEM_OWNER Pilot flow fixes through PR #251 merged).
- PR #239 merged the current security/communication/password-recovery/installation/backup-restore integration.
- PR #240 CI and Internal Windows Setup passed before merge.
- Latest verified quality baseline:
  - Backend: typecheck/build/lint/format passed; 137 test files / 965 tests passed.
  - Frontend: typecheck/lint/format/build passed; 56 test files / 311 tests passed.
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

- COM-01 through COM-06: **SOURCE MERGED TO MAIN / SOFTWARE VERIFICATION COMPLETE**.
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

Status: **COM-01 THROUGH COM-06 MERGED / COM-07 LIVE ACCEPTANCE PENDING**.

Current evidence:
- PR #235 implemented COM-01 through COM-06 and the work is now integrated into `main` through PR #239.
- The integrated source passed subsequent CI and Internal Windows Setup verification through PR #240.
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
