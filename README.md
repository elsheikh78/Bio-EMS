# BIO-EMS

Enterprise Environmental Monitoring System for regulated and operational environments.

**Current source version:** `0.20.0`  
**Latest published source release:** `v0.20.0`  
**Current phase:** Pilot stabilization and qualification

## Read these first

| Question | Authority |
| --- | --- |
| Where is the project now? | `PROJECT_STATE.md` |
| What do we execute next? | `IMPLEMENTATION_PLAN.md` |
| What did the 11 September complete audit conclude? | `docs/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md` |
| What is the current Pilot scope? | `PILOT_SCOPE.md` |
| What are the active project risks? | `RISK_REGISTER.md` |
| What controls Communication Channel Administration? | `docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md` |
| What controls the Windows installer? | `docs/deployment/FULL-OFFLINE-WINDOWS-INSTALLER-PLAN.md` |
| What controls future device trust? | `docs/security/device-registration.md` and `docs/security/activation-workflow.md` |

Historical Sprint/P/BF/UX closure documents remain evidence ledgers. If a historical document conflicts with current status, `PROJECT_STATE.md` and `IMPLEMENTATION_PLAN.md` control.

## Current position

The core source platform is mature. The latest audited CI baseline passed:

- Backend typecheck/build/lint/format;
- Backend 114 test files / 809 tests;
- Frontend typecheck/lint/format/build;
- Frontend 52 test files / 299 tests.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Current execution order

1. COM-01 through COM-06 Communication Channel Administration.
2. Build a fresh controlled internal Pilot Setup.
3. Qualify installation on multiple clean Windows computers.
4. Complete COM-07 Pilot acceptance.
5. Execute hardware bench qualification.
6. Close required SMS/GSM and notification failover evidence.
7. Install and commission BIO EGYPT Pilot.
8. Stabilize defects from real operation.
9. Implement deferred production-grade Device Trust/commercial protection.
10. Complete production signing, manuals, presentation and final Production Installer release.

The production Device PKI/mTLS/Secure Boot/host-transfer architecture is approved, but final implementation is intentionally deferred until Pilot Setup and hardware are stable.

## Platform capabilities

BIO-EMS currently includes:

- TypeScript/Express backend.
- React/TypeScript/Vite frontend.
- SQLite operational/configuration persistence.
- InfluxDB telemetry history.
- MQTT telemetry ingestion and recovery semantics.
- Alarm thresholds, persistence delays and lifecycle evidence.
- Dashboard, Monitored Areas and Live Monitoring Wall.
- Arabic/English with RTL/LTR.
- JWT/RBAC and isolated SYSTEM_OWNER trust boundary.
- Audit trail and User Management.
- Sensor calibration workflows.
- Notification recipients and escalation policies.
- Email, Telegram, WhatsApp source providers and SMS failover/provider contracts.
- Durable notification delivery jobs and operations.
- Reporting Center with Preview/CSV/PDF.
- Installation provisioning and commissioning workflows.
- Existing licensing/anti-copy source controls.
- Full offline Windows installer source/build pipeline.

## Notification evidence

- Email live delivery: passed.
- Telegram live delivery: passed.
- Critical Alarm -> Email + Telegram end-to-end path: passed.
- Meta WhatsApp live acceptance: open and externally blocked.
- SMS/GSM live evidence: open.
- Telegram is the approved interim online Pilot channel while WhatsApp remains blocked.

## Communication Channels configuration

Approved next source work adds:

`Configuration -> Communication Channels`

SYSTEM_OWNER and ADMIN will be able to manage Email, Telegram, WhatsApp and SMS/GSM provider connection settings, secure secrets, test actions and channel failover without rebuilding BIO-EMS or editing PowerShell/deployment files.

## Windows Setup status

Installer source is materially advanced:

- single-EXE internal artifact pipeline;
- internal Pilot Authenticode signing;
- one-click elevated launcher;
- automatic install diagnostics;
- partial-install/clean-device repair fix.

Still required:

- successful post-fix clean-machine install evidence;
- all three BIO-EMS services;
- HTTPS/API/frontend health;
- reboot recovery;
- Repair/Upgrade/rollback;
- retained-data Uninstall;
- repeatability on more than one clean Windows PC;
- final production signing/publication decision.

## Architecture boundary

The controlled domain remains:

`Site -> Monitored Area (Room) -> Sensor`

Do not create a second competing Monitored Area backend domain.

## Version / release rule

`VERSION`, backend package version and `release-manifest.json` remain at `0.20.0` until an explicit next-release decision.

No documentation merge by itself creates a new release or production-ready claim.

## Evidence boundary

Source/CI completion is not physical or customer acceptance.

Separate evidence is still required for:

- installer qualification;
- hardware qualification;
- SMS/GSM live failover;
- physical installation;
- calibration;
- commissioning;
- customer UAT/acceptance;
- deferred production-grade security/protection;
- commercial Production Installer release.
