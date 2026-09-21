# BIO-EMS Implementation Plan

**Plan date:** 19 September 2026  
**Master audit:** `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`

## Immediate restart point — 20 September 2026

1. Verify the latest PR #239 Prettier, CI and Internal Windows Setup results for the frontend cache revalidation fix.
2. Build/use only the resulting current artifact and physically retest bare `https://localhost/login` with no query-string cache bust and no hard refresh.
3. Create the installation-bound SYSTEM_OWNER commissioning request on the customer host; sign it only on the manufacturer-controlled machine with the encrypted private key; import the signed package; enroll MFA via the locally rendered QR; confirm SYSTEM_OWNER login and audit evidence.
4. Execute physical Repair and prove preservation of customer/site/installation identity, SQLite, Influx telemetry, configuration and commissioned owner state.
5. The visible ADMIN/System Owner Backup & Restore UI and optional automatic schedule (6h/12h/daily/weekly, retention 1-30) are source implemented on PR #239. Execute physical manual backup -> controlled mutation -> Restore, scheduled execution/retention, historical Influx telemetry + identity restoration and negative rejection cases.
6. Review stacked PRs: #239 is the current merge vehicle; #233/#235/#237 are ancestor integration layers to close as superseded only after final #239 acceptance; #138 is stale/conflicted documentation and should not be merged as-is.
7. Only after all PR #239 acceptance gates are green, update final evidence/docs and decide the merge to `main`.

## Objective

Move BIO-EMS from mature source software to a repeatable, field-tested BIO EGYPT Pilot, then implement the final commercial protection layer only after the Pilot software/hardware path is stable.

## Phase 0 — Current security / integration gates

- SEC-OWNER-01 source is implemented on PR #233 but intentionally remains unmerged pending the real manufacturer Ed25519 key ceremony, Production keyring build, offline commissioning exercise and Production security review.
- Customer ADMIN provisioning during Setup is merged to main via PR #231 and has been validated in a clean Pilot install.
- The active integration line is PR #235 / `feat/com-01-06-communication-channels`, stacked on SEC-OWNER work.
- Do not describe either SEC-OWNER Production acceptance or COM-07 as complete until their external evidence gates close.

## Phase A — Communication Channel Administration

### COM-01 — Secure configuration domain

Status: **SOURCE IMPLEMENTED ON PR #235 / COM-07 ACCEPTANCE PENDING**

- define channel/provider configuration model;
- protected/encrypted secret storage;
- redacted read model;
- migrations/repository/service;
- no-secret logging and backup boundary.

### COM-02 — RBAC API

- SYSTEM_OWNER + ADMIN mutation authorization;
- redacted GET;
- update/enable/disable endpoints;
- channel-order/failover contract;
- negative RBAC and secret disclosure tests.

### COM-03 — Provider runtime integration

- Email managed config;
- Telegram managed config;
- WhatsApp managed config;
- SMS/GSM transport abstraction;
- safe runtime reload or controlled restart;
- migration compatibility from existing environment configuration.

### COM-04 — Frontend

- `Configuration -> Communication Channels`;
- Email/Telegram/WhatsApp/SMS-GSM panels;
- masked secrets;
- Save/Cancel/validation;
- Arabic/English;
- RTL/LTR;
- light/dark/responsive.

### COM-05 — Test actions

- Test Email;
- Test Telegram;
- Test WhatsApp;
- Test SMS;
- secret-safe diagnostics/audit.

### COM-06 — Failover / regression

- ordered channel priority/fallback;
- recipient/escalation non-regression;
- durable delivery integration;
- reboot persistence;
- full Backend/Frontend quality gates.

### COM-07 — Pilot acceptance

Executed only after the software is installed on the Pilot target and real provider evidence is available.

## Phase B — Fresh Pilot Setup build

Current automated Pilot Setup evidence exists on PR #235 (CI #1021 and Internal Windows Setup #330 passed). After the integration/security merge gates are deliberately closed:

1. Build from authoritative `main`.
2. Generate controlled internal signed Pilot Setup.
3. Record artifact SHA-256 and certificate fingerprint.
4. Package one-click launcher and installation diagnostics.
5. Keep artifact clearly labeled internal/Pilot, not Production.

## Phase C — Installer qualification

Run on clean isolated Windows 10/11 x64 computers.

### IQ-01 Fresh Install

Verify:
- Setup launches normally;
- BIOEMS-MQTT installed/running;
- BIOEMS-InfluxDB installed/running;
- BIOEMS-Backend installed/running;
- HTTPS application opens;
- API health passes;
- persistent data/config/log paths are correct.

### IQ-02 Reboot recovery

- automatic services;
- application health;
- retained configuration;
- no manual PowerShell requirement for normal use.

### IQ-03 Repair / Upgrade / rollback

- verified backup;
- controlled service lifecycle;
- health-gated result;
- rollback on failure;
- no data loss.

### IQ-04 Uninstall

- program/services removed as designed;
- retained customer data/evidence preserved according to policy.

### IQ-05 Repeatability

Repeat on at least one additional clean PC to detect machine-specific assumptions.

## Phase D — Hardware bench qualification

1. Freeze Pilot BOM.
2. Assemble Site Controller/Pilot hardware.
3. Sensor accuracy and calibration checks.
4. Wiring/protection checks.
5. Controller registration/mapping.
6. Real MQTT telemetry.
7. disconnect/reconnect and buffering/replay.
8. power-cycle recovery.
9. real Alarm threshold challenge.
10. Email/Telegram notification challenge.
11. SMS/GSM fallback challenge.
12. endurance gate where applicable.

## Phase E — BIO EGYPT field Pilot

1. install Pilot platform at approved Site computer;
2. install/map controller and Sensors;
3. record calibration;
4. verify all areas/readings;
5. challenge warning/critical Alarms;
6. verify recipient/escalation routes;
7. network/power/reboot tests;
8. technical Commissioning;
9. customer ADMIN UAT/acceptance;
10. close Pilot defects.

Pilot remains **NOT COMMISSIONED / NOT ACCEPTED** until this evidence exists.

## Phase F — Pilot stabilization

- collect real defects;
- prioritize Severity 1/2;
- implement/retest;
- rerun installer/hardware regressions where affected;
- freeze Pilot-stable baseline.

## Phase G — Deferred commercial protection

Only after Phase F:

- DEV-TRUST-01 PKI/key-management hierarchy;
- DEV-TRUST-02 device lifecycle registry;
- DEV-TRUST-03 protected ESP32 key generation/storage;
- DEV-TRUST-04 MQTT mTLS/topic authorization;
- DEV-TRUST-05 secure provisioning;
- DEV-TRUST-06 revocation/rotation/replacement;
- DEV-TRUST-07 signed firmware/Secure Boot/Flash Encryption;
- DEV-TRUST-08 clone detection/security audit;
- DEV-TRUST-09 offline trust/revocation;
- DEV-TRUST-10 PC migration integration;
- DEV-TRUST-11 negative/recovery/field acceptance.

Existing LIC-01 through LIC-13 source work is retained. The deferred phase completes the production-grade device trust/host replacement/commercial protection architecture rather than forcing that moving target into early Pilot-machine testing.

## Phase H — Commercial production release

- final supported Windows matrix;
- commercial/public Authenticode decision;
- final Production Installer qualification;
- licensing/security qualification;
- backup/restore/DR drills;
- User Instruction Manual;
- SYSTEM_OWNER Instruction Manual;
- commissioning/service documentation;
- professional product presentation/video;
- version/tag/release publication.

## Parallel non-blocking work

- Meta WhatsApp onboarding may continue in parallel.
- Telegram remains the interim online Pilot channel.
- Documentation/manual content can be prepared incrementally but final screenshots/instructions wait for stable Pilot UI/hardware.
- Hardware procurement can proceed while COM source implementation is underway if BOM items are already approved.

## Immediate execution order — 16 September 2026

1. Preserve current PR #235 integration branch as the documentation/source authority for unmerged SEC-OWNER + COM work.
2. Complete the manufacturer private-key ceremony outside GitHub/CI/customer machines and provide only the approved public keyring to the Production build process.
3. Run end-to-end SEC-OWNER commissioning with the offline-held private key; record negative/security evidence.
4. Close the intended SEC-OWNER merge gate without weakening the Pilot/Production boundary.
5. Complete COM-07 with real provider credentials/endpoints and actual SMS/modem/SIM evidence where applicable.
6. Complete remaining physical Windows qualification: reboot, Repair/Upgrade/rollback, retained-data Uninstall and a second clean PC.
7. Proceed to hardware bench qualification and BIO EGYPT field commissioning/UAT.

## Definition of done

Every package requires the evidence appropriate to its type:

- source package: code + tests + PR + CI + merge;
- provider: actual provider delivery;
- installer: real clean-machine execution;
- hardware: real bench/field evidence;
- commissioning: signed/recorded Site evidence;
- production: security/licensing/signing/release gates.

No package is closed by documentation alone.
