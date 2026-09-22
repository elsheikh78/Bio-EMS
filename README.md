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
| ماذا يجب على مالك المنصة أن يفعل بنفسه الآن؟ | `docs/project-management/NEXT-OPERATOR-ACTIONS-AR-2026-09-16.md` |
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
- Backend typecheck/build/lint/format passed; 137 test files / 965 tests passed on the current Windows verification baseline;
- Frontend typecheck/lint/format/build passed; 56 test files / 311 tests passed on the current verification baseline.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Current execution order

1. Complete repository hygiene and keep `main` as the single authoritative integration line.
2. Verify the merged SYSTEM_OWNER entry, commissioning and MFA workflow on the current Pilot build.
3. Verify the merged Communication Channels configuration and live test actions; complete COM-07 provider/hardware acceptance.
4. Continue qualification on multiple clean Windows computers, including Repair/Restore evidence.
5. Execute hardware bench qualification.
6. Close required SMS/GSM and notification failover evidence.
7. Install and commission BIO EGYPT Pilot.
8. Stabilize defects from real operation.
9. Implement deferred production-grade Device Trust/commercial protection.
10. Complete Production key ceremony/signing, manuals, presentation and final Production Installer release.

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

Merged source work (integrated through PR #239) provides:

`Configuration -> Communication Channels`

SYSTEM_OWNER and ADMIN can manage Email, Telegram, WhatsApp and SMS/GSM provider connection settings, secure secrets, test actions and channel failover without rebuilding BIO-EMS or editing PowerShell/deployment files.

## Windows Setup status

Installer source is materially advanced:

- single-EXE internal artifact pipeline;
- internal Pilot Authenticode signing;
- one-click elevated launcher;
- automatic install diagnostics;
- partial-install/clean-device repair fix.

Current `main` includes the installer/security/backup integration merged through PR #239 plus the Windows portability correction from PR #240. PR #240 CI and Internal Windows Setup both passed, and a separate clean-install exercise verified all three BIO-EMS services and customer ADMIN login.

Still required:

- HTTPS/API/frontend health regression where affected;
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


## 19 September 2026 integration checkpoint

- Active integration authority: draft PR #239 / `feat/dep-br-backup-restore`; it contains the stacked SEC-OWNER, COM, AUTH-RECOVERY and DEP-BR work carried forward from PRs #233, #235 and #237.
- Manufacturer owner key `owner-primary-2026` was verified directly against the encrypted offline private key; approved SPKI DER SHA-256 is `495ae8e780a32b671518f06a371612b884327e899b67ca0483a21813be50fb81`.
- Automated fingerprint pinning, CI and the prior Internal Windows Setup gate passed. Physical commissioning remains open.
- Physical Windows acceptance on 19 September confirmed services and HTTPS health and exposed a stale browser/frontend shell at bare `/login`; cache-busted navigation loaded the current UI and ADMIN credentials succeeded. PR #239 now carries a cache revalidation fix which must pass CI/Windows and then be physically retested without cache-busting.
- Do not merge PR #239 until physical SEC-OWNER commissioning/MFA, Repair preservation, Backup/Restore historical telemetry and remaining DEP-BR acceptance are complete.
- Older stacked PRs #233/#235/#237 are historical integration layers; reconcile/close them only after confirming #239 remains a strict descendant and is the selected merge vehicle. PR #138 is obsolete/conflicted documentation and should not be merged as-is.

## 16 September 2026 status note

- `main`: `653a573` (customer ADMIN Setup provisioning merged via PR #231).
- SEC-OWNER-01: implemented on PR #233; Production acceptance/merge remains gated by the real manufacturer key ceremony and offline commissioning evidence.
- Active integration: draft PR #235 / `feat/com-01-06-communication-channels`; COM-01 through COM-06 source implemented and automated Windows Setup gate passed; COM-07 live acceptance remains open.
- Product version remains `0.20.0`; this documentation sync does not create a new release.
