# BIO-EMS Project State

Reviewed 31 October 2026. This file is the current-state authority. The current summary and remaining gates below take precedence over dated historical checkpoints, which are retained at the end for traceability.

## Admin/Owner network and optional battery candidate — 1 November 2026

A source candidate adds independent network/battery pages for customer ADMIN and System Owner; OPERATOR/VIEWER are denied. It retains bindings, encrypts Wi-Fi secrets, checks concurrent revisions and requires Wi-Fi-specific confirmation with rollback. Optional central backup defaults to not fitted, suppressing power/battery incidents and pausing repeats without inventing recovery. Candidate: Main pilot.11, Tester 0.7.1, HQT-4 (21 steps), client migration 37. The integrated baseline below remains the reference until merge/build qualification. See [operation and rollout](docs/current/MAIN-NETWORK-AND-OPTIONAL-BATTERY.md). Installed versions and HW-01–HW-10 / DEP-01 remain unverified; no live deployment or physical acceptance is claimed.

## Main resilience integrated — 31 October 2026

PR [#316](https://github.com/elsheikh78/Bio-EMS/pull/316) is merged at `95ff1c9b519c49fe23fb3ed721b55e8ed559a444`. Reviewed PR head: `13131fd4b5620c7dcc315eabbd21398d957fcb74`; all **seven** workflows completed successfully. Their distributed Pilot binaries identify CI merge `ff8b6ba53c44e74a46707b5daf99f1b808be72e4`, not a new tagged release or proof of a field upgrade. See [integration receipt](docs/hardware/evidence/MAIN-RESILIENCE-INTEGRATION-2026-10-31.json) and [behavior, limits and rollout](docs/current/MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md).

Current merged source: product **0.20.0**, Main **0.1.0-pilot.10**, Nano **0.1.0-bench.2**, Tester **0.7.0**, new-run qualification **HQT-3 / 21 steps**. Implemented: Ethernet → Wi-Fi → encrypted BLE fallback, SD write-ahead/replay with duplicate receipts, highest-priority power/storage events, automatic commissioning and System Owner feature controls. The owner UI distinguishes saved/applied revisions; policies retain actor/reason history and reject disabling every path. Platform optional switches cover reports, calibration, notifications, backups and updates; channel/cloud controls retain their own pages.

### Documentation reconciliation — 31 October 2026

Central backup/SD design now reflects pilot.10 supervision inputs, DS3231 support, connection priority, durable replay, bounded NVS transitions and Owner policy controls. Active firmware and Tester instructions align with pilot.10 / 0.7.0 / HQT-3; immutable archives and security checkpoints retain their original dates. See [central backup and SD specification](docs/hardware/MAIN-CENTRAL-BATTERY-AND-SD-2026-10-18.md). The 30-minute complete-load requirement remains unverified; no physical gate below is closed by this documentation review. New Main incidents are local-only, and autonomous GSM fallback remains unimplemented.

### Completed software/build evidence

- Local backend 1116 tests, frontend 359, Tester 78, BLE bridge 3: **1556 tests passed**. Backend/frontend typecheck, lint, formatting and production builds passed; documentation integrity passed.
- Exact-head CI: source quality/cloud gates, documentation integrity, security operations, both firmware layouts, manufacturer tools, standalone Tester and Windows Setup all passed.
- Windows CI: fresh installation/health, public trust, Repair ACL migration, real installed Influx backup/history restore, client update worker, signed offline ADMIN recovery, controlled New Install over an existing installation and final Setup artifact upload passed.
- These are controlled software/CI results. They do not certify the owner's PC, attached USB BLE radio, supply design, battery, card, sensors or BIO EGYPT commissioning. Actual installed versions remain unverified.

### Open tests and follow-up reminders — do not infer PASS from CI

All rows below remain **OPEN** until their evidence is linked. The responsible party is the owner/bench operator, with review against the controlled procedure. Keep raw data, exact package/firmware hashes, board/adapter/card identities, instrument/approved limits, date, operator and a linked retest where applicable.

| ID | State | Remaining check / evidence needed |
| --- | --- | --- |
| HW-01 | NOT TESTED | USB BLE adapter/driver on the actual Windows PC; backend-service account access, unattended reception after Windows restart, disconnect/reconnect and final enclosure range at 5 and 10 m. |
| HW-02 | NOT TESTED | Ethernet cable loss **and application delivery failure**, Wi-Fi loss, fallback to BLE, loss of all three, return of each path and higher-priority recovery. Measure failover latency and acquisition cadence under backlog; zero-delay/fixed-cadence behavior is not established. |
| HW-03 | DESIGN / ASSEMBLY PENDING | Build/review the actual central backup and charging circuit for Main plus up to four SIMs; approve BOM, safe low-voltage mains-good/battery-low conditioning, polarity and unused GPIO assignments before enabling physical supervision. Inputs currently default to unwired/unknown. |
| HW-04 | NOT TESTED | Remove main input under full load; measure changeover, rails, resets and continuous operation for at least 30 minutes with Main + four SIMs + sixteen sensors; then restore/recharge and inspect modem burst loading if fitted. |
| HW-05 | NOT TESTED | Approved battery-low limit/signal, mains-loss and recovery, false-trigger/debounce behavior and highest-priority event timestamps. Do not invent a battery chemistry/voltage acceptance limit. |
| HW-06 | NOT TESTED | microSD absent, removed, near-full threshold (default 80%), configured queue capacity, full/read-only/write failure, corruption and reinsertion/recovery. Verify CRITICAL alerts and preservation of existing history; no auto-format or silent overwrite. |
| HW-07 | NOT TESTED | Offline samples across Main restart, original UTC timestamps, counts, sample IDs and automatic replay without duplicate database processing. Test loss during send/ack, server restart, live traffic with backlog, and paused replay retaining history. SQLite/Influx/alarm effects are not one cross-store transaction. |
| HW-08 | NOT TESTED | With SD unavailable and all transports lost, retain power/storage transitions in NVS, reboot, reconnect and verify original event sequence/time. Exercise the bounded 24-transition journal and explicit full/write/corruption faults; storage is not unlimited. |
| HW-09 | NOT TESTED ON HARDWARE | Exercise every Main switch and platform switch through System Owner; verify disabled paths, saved/applied revisions, unreachable candidate rollback after 60 seconds, no retry of rejected revision until a new save, concurrent-edit rejection and customer-role denial. Software cases passed; device/installed UI behavior still needs evidence. |
| HW-10 | NOT TESTED | Real configured recipients/providers: highest-priority CRITICAL delivery, repeat every five minutes, acknowledgement and recovery cancellation, provider failure/recovery. No immediate platform notification is possible during loss of all host paths. |
| HW-11 | NOT TESTED / FULL POPULATION OPEN | Preserve staged sensor/cable tests at 5/10/intended maximum 20 m, four-hour long RS485/power link, unique SIM addresses 1–4, sixteen-channel mapping, 24-hour selected-population and 48-hour full-population endurance with no unexplained resets/unrecovered faults. Automated Tester acquisition observes one selected Nano/four probes. |
| HW-12 | NOT TESTED / REVIEW REQUIRED | Traceable calibration/accuracy, missing/replaced probe isolation and reference comparisons; commissioned DS3231 retained UTC and historical time after power loss. Earlier limited ESP32/probe evidence does not close the full assembly. |
| DEP-01 | NOT DEPLOYED / NOT VERIFIED | Upgrade the actual client before Main pilot.10 (migration 36), configure Wi-Fi fallback, qualify BLE, verify actual package hashes/health and retained data, and test recovery/rollback on the intended Windows machine/second PC. CI installation is not this field result. |
| SITE-01 | NOT COMMISSIONED / NOT ACCEPTED | BIO EGYPT site mapping, placement, population, calibration, roles, provider receipts, training and signed site acceptance; retain site-specific evidence. |

### Required reminder behavior for future project follow-up

Whenever this project resumes for status, testing, a setup/release download, deployment, commissioning or acceptance, read this open-gate table first and remind the owner of the **relevant open IDs**, especially HW-01–HW-10 and DEP-01 before relying on the new features. In release/status answers distinguish merged code, passed CI, installed versions and physical acceptance. Do not say the project is fully tested/ready for operation while these gates are open. Record an owner's completion report as **OWNER-REPORTED — EVIDENCE REVIEW PENDING** until the matching result is reviewed; then update that row with result/date/run/evidence and preserve any previous failure. This project-state reminder rule does not itself create a scheduled background notification.

### Other implementation and production holds

Autonomous Main GSM/SIM800L alarm fallback remains **NOT IMPLEMENTED**, not a failed or passed test; explicit modem diagnostics/SMS remain separate. A dedicated implementation and acceptance package is required before claiming independent alerts during total host-link loss. Long-term ingress receipt retention and transport-dependent polling cadence remain documented operational limits. Production device PKI/mTLS, key custody, NVS/console protection and designated-board recovery/manufacturing qualification remain open; do not activate irreversible eFuses on ordinary test boards. The existing mobile advisories and independently unverified live cloud receipts below remain open too.

## Historical integrated security baseline — 29 October 2026

PR #313 is merged at `6e43f7c7822dff9c576ebd4678eaf9740eb7d311`. All nine workflows on reviewed head `acf2b6eaaf0fe47f116f45dfe47d55b787492bbd` passed, including complete Windows Setup install/update/restore/New Install, native certificate rotation/failure recovery, both Main layouts, Tester and mobile workflows. Distributed CI binaries identify the tested PR merge `93c68a6a4a077f089b3aff6e3982a7afe167e462`; these are tested Pilot builds, not a new tagged release or physical acceptance.

Source at that security checkpoint: product 0.20.0, Main pilot.9, Nano bench.2, Tester 0.6.2. Protected D1 deployment and Windows certificate/trust maintenance tools are ready; no remote migration/deployment, live-PC certificate replacement, owner production-key creation or eFuse activation was performed. Each mobile dependency tree retains 3 High/5 Low affected Expo-tooling entries. Full device PKI/mTLS, NVS/console security policy, key custody and designated-board recovery/manufacturing acceptance remain open. See [integration evidence](docs/security/evidence/SECURITY-INTEGRATION-2026-10-29.json) and [execution guide](docs/security/SECURITY-OPERATIONS-AR.md).

## Current closure and remaining gates — 31 October 2026

| Finding / gate | Current evidence and status |
| --- | --- |
| Customer login throttling and credential-change session invalidation | Fixed in source and merged through PR #313. |
| Company cookie revocation after logout and key binding | Fixed in source and merged; migration 0003 must precede the matching Worker. |
| Backend/frontend/company-cloud dependency findings | Recorded all-dependency scans at the reviewed security head report zero affected entries; this is a dated scan result. |
| Main TLS endpoint identity | Implemented in pilot.9 with certificate preflight; live certificate/trust rollout remains installation-specific. |
| Windows certificate rotation/recovery and guarded D1 deployment | Tools merged and CI verified; readiness is separate from live execution. |
| Mobile dependency findings | Each app retains 3 High / 5 Low Expo-tooling affected entries at the reviewed baseline. |
| Production device protection | Per-device PKI/mTLS, NVS/console policy, production keys/custody and physical protection/recovery acceptance remain open. |
| Cloudflare execution | Owner reported successful PowerShell steps in the project conversation. Exact migration/deployment receipt, deployed Worker version and post-deployment session tests have not been independently inspected in this review. |
| Physical / installed-system acceptance | Requires installation-specific and designated-board evidence; source integration and CI do not close it. |

PR #314 merged the integration-status documentation. The earlier statement that no remote operation was performed describes the repository audit/automation boundary; it does not negate the owner's later reported execution. Do not mark live migration or deployment independently verified without matching receipts and live checks.

## Exact source and release boundary

| Item | Reviewed state |
| --- | --- |
| Main resilience source integration | `95ff1c9b519c49fe23fb3ed721b55e8ed559a444`, PR #316 |
| Security code integration | `6e43f7c7822dff9c576ebd4678eaf9740eb7d311`, PR #313 |
| Historical audit integration | `c8d4e4f7b4a19bcc63472f8f706bc708122aa6de` |
| Historical audit candidate | `d151b1f3aba42e4c5d0ad0b34696c71db2cb7cfc`, PR #311, open at audit |
| Product source / backend / release manifest | `0.20.0` |
| Latest published tagged source release | `v0.20.0`, published 7 September 2026; not a release of the merged October changes |
| Current Hardware Tester | `0.7.0` (PR #316) |
| Main / Nano operating firmware | `0.1.0-pilot.10` / `0.1.0-bench.2` (PR #316) |
| Company / customer mobile app source | Separate apps, each `0.1.0` |
| Current installed binaries / matching live Worker | Not inspected in this audit |

The documentation audit was based on candidate `d151b1f` before integration. PR #311 and #312 are now merged; no binary publication/deployment/physical acceptance follows automatically. Security remediation is now integrated through PR #313; the checkpoints above retain their earlier source/deployment boundaries. The historical audit paragraphs did not themselves change source versions or deploy migrations; current Main/Tester versions and migration 36 are identified in the PR #316 integration section above.

## Historical audit baseline — 28 October 2026 (superseded for remediated source findings)

Backend: 1091 tests; frontend: 354; company cloud: 27; customer mobile: 3; company mobile: 3; standalone Tester: 73. Total: **1551 routine tests**, all passed. Backend/frontend typecheck, lint, formatting and build; cloud build/dry-run; both Expo typechecks/exports; Tester report smoke; C queue and peripheral protocol host suites passed. Two additional isolated audit probes reproduced the customer authentication findings. Host runtime was Node 24.22.1/npm 11.9.0; normal backend/frontend CI specifies Node 22.

At that audit baseline, dependency scans reported Critical/High findings, and isolated probes reproduced missing customer login throttling and credential-change token invalidation. See the preserved [audit findings](docs/audit/2026-10-28/FINDINGS.md) and [dependency evidence](docs/audit/2026-10-28/DEPENDENCIES.md). These are historical findings, not a claim that the same defects remain in current main. PR #313 merged the customer-authentication and company-session fixes; its recorded backend/frontend/company-cloud all-dependency scans report zero affected entries. The nine final workflows passed. Mobile Expo-tooling advisories and production/deployment/hardware gates remain open as stated in the current summary. A successful build does not certify the installed or live system.

## Hardware responsibility and implemented limits

All new hardware qualification belongs to standalone Tester, currently 0.7.0. System Owner retains installation configuration, discovery, provisioning and device binding. Hardware Lab UI is removed; former write endpoints return HTTP 410; authenticated historical GETs and old database rows remain. There is no automatic historical database migration into Tester.

Tester includes isolated QC flash, separate operating firmware flash and a 21-step HQT-3 qualification checklist. Nano classic uses 57600 for upload; new bootloader uses 115200; QC runtime uses 115200. Operating Main/Nano bus uses 9600 8N1. Main has **one shared RS485 bus and up to four unique Nano addresses**, four channels each. The automated integrated scope observes **one selected Nano/four probes**. Independent full-population evidence is still required for sixteen probes.

SD buffering/replay, RTC commissioning/retention and explicit GSM diagnostic/SMS commands exist in firmware. Autonomous controller GSM alarm fallback is **not implemented**. Power rail limits must come from the approved design/component specification; Tester does not supply a universally approved power tolerance. Device PKI/mTLS, Secure Boot, Flash Encryption and final commercial protection remain deferred requirements rather than proven production controls.

## Field, deployment and acceptance evidence

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**. No physical bench is connected to this audit. Actual 20 m bus/power behavior, calibration, 24/48-hour populated endurance, full-load central backup, storage retention and actual SMS receipt require recorded tests. Clean Windows reboot/repair/upgrade/restore/rollback and second-PC qualification require their own evidence. Source builds and prior installer CI are not current physical acceptance.

Historical evidence is retained without extension: the 14 October Viewer deployment observation and 22 October company Android pilot result remain dated records. They do not prove current Worker deployment, all admin actions, native iOS acceptance or customer background alarm delivery. Customer mobile foreground monitoring is implemented; native background remote push is not.

## Current navigation

- [Audit scope, evidence and results](docs/audit/2026-10-28/README.md)
- [Current implementation guides](docs/current/README.md)
- [Approved execution plan](IMPLEMENTATION_PLAN.md), [risks](RISK_REGISTER.md)
- [Hardware/firmware boundary](docs/current/HARDWARE-AND-FIRMWARE.md), [qualification gates](docs/current/QUALIFICATION-AND-ACCEPTANCE.md)

Status changes require exact source/build identifiers and explicit evidence. Historical merge, provider and commissioning results are never inherited by a newer binary automatically.

## Historical implementation checkpoints — not current status

The following text preserves what was known at each checkpoint. Phrases such as “unmerged”, “being retried”, “blocked on authentication” or older firmware/tester versions apply only to that dated checkpoint. Current merged status and final successful CI are stated above; no live deployment or hardware acceptance is inferred from these historical entries.

### Historical checkpoint: Security operations checkpoint before integration — 29 October 2026

All native CI on prior head 6861784 passed, including Windows Setup. The subsequent source candidate adds guarded D1 backup/migration/deployment from PowerShell, transactional Windows TLS activation/recovery, an owner-side signing-key preparation tool, and a separately built Main A/B USB-maintenance profile. Normal Main becomes pilot.9 and Tester 0.6.2; ordinary packages remain single-app. First-boot A/B confirmation has a 180-second deadline and explicit operator acceptance. CI on 0bd43ac verified both ESP-IDF profiles, native Windows certificate activation/failure recovery, backend/frontend/cloud, both mobile builds, Tester and documentation. Windows Setup encountered a vendor transport reset and is being retried; the follow-up adds bounded verified downloads and a USB-console-prompt regression. Designated-board and deployed acceptance remain open. No remote D1/Worker operation, live-PC certificate rotation, owner production-key creation or device/eFuse activation has occurred. See [Arabic execution guide](docs/security/SECURITY-OPERATIONS-AR.md) and [ADR-027](docs/adr/ADR-027-security-operations-and-recoverable-main.md).

### Historical checkpoint: Main TLS, mobile and device protection candidate — 28 October 2026

Main pilot.8 requires endpoint identity checks; provisioning validates exact certificate SAN/validity before flash and credential transfer. Windows supports DNS/IP SAN issuance and non-overwriting candidate preparation. Tester 0.6.1 captures actual Secure Boot/encryption state without granting acceptance; an optional firmware startup gate requires both already enabled. No eFuses or production keys have been changed. Both mobile dependency trees received compatible patches, but retain 3 High / 5 Low Expo-tooling package entries each. Local backend 1111 tests and Tester 78 tests passed; both mobile exports passed. Native CI and physical acceptance are separate. Remote D1 migration remains blocked on Cloudflare authentication. See [TLS rollout](docs/security/MAIN-TLS-ENDPOINT-IDENTITY-WORK-PACKAGE.md), [device/mobile/deployment status](docs/security/DEVICE-PROTECTION-AND-MOBILE-STATUS.md) and [ADR-026](docs/adr/ADR-026-main-tls-identity-and-device-security-gate.md).

### Historical checkpoint: Security phase two candidate — 28 October 2026

The unmerged security candidate now adds D1-backed company-cookie revocation and migration 0003. Copied cookies are rejected after logout; company key rotation invalidates old sessions. Legacy company cookies require re-login; apply the additive migration before matched Worker deployment. No remote migration/deployment has been performed.

Vitest 5 migration retains all 1101 backend / 357 frontend tests; cloud includes 30 tests. All-dependency npm scans for backend/frontend/company-cloud report zero affected entries in the candidate, including development tools. Mobile/Python/vendor/device-trust work is not certified. The later Main TLS candidate above removes firmware exceptions with certificate identity preflight; installed-site rollout remains open. See [phase-two guide](docs/security/COMPANY-SESSIONS-AND-TEST-TOOLING-REMEDIATION.md).


Historical audit reviewed 28 October 2026. This subsection records the audit baseline, not current integration status; dated evidence is preserved in [the pre-audit snapshot](docs/archive/2026-10-28-pre-audit/PROJECT_STATE.md).

### Historical checkpoint: Phase-one checkpoint (superseded by phase two above) — 28 October 2026

User-authorized A02/A03 fixes are implemented on `fix/customer-auth-audit`, not yet merged/deployed: bounded customer login throttling; credential-bound customer tokens; old token rejection after own/admin/offline password replacement; replacement session installed by the matching frontend. Existing customer sessions must log in again on initial upgrade. Compatible lockfile updates and deliberate Nodemailer 10 upgrade reduce backend/frontend production npm audit entries to zero in the candidate; Phase-one development/tooling and company-session findings are addressed in the later phase-two source candidate above; Main TLS, mobile dependencies and production device trust remain open.

Local Node24 verification: backend 1101 tests/164 files; frontend 357 tests/64 files; typecheck/lint/format/build and documentation checks. See [remediation design and rollout](docs/security/CUSTOMER-AUTH-AUDIT-REMEDIATION.md) and [ADR-024](docs/adr/ADR-024-customer-access-token-credential-binding.md). Remote CI and source integration remain separate gates.

