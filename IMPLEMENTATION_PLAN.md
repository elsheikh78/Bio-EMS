# BIO-EMS Implementation Plan

**Plan date:** 11 September 2026  
**Master audit:** `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`

## Objective

Move BIO-EMS from mature source software to a repeatable, field-tested BIO EGYPT Pilot, then implement the final commercial protection layer only after the Pilot software/hardware path is stable.

## Phase A — Communication Channel Administration

### COM-01 — Secure configuration domain

Status: **NEXT**

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

After COM-01 through COM-06 merge:

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

## Definition of done

Every package requires the evidence appropriate to its type:

- source package: code + tests + PR + CI + merge;
- provider: actual provider delivery;
- installer: real clean-machine execution;
- hardware: real bench/field evidence;
- commissioning: signed/recorded Site evidence;
- production: security/licensing/signing/release gates.

No package is closed by documentation alone.
