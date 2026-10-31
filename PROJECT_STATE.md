# BIO-EMS Project State

Reviewed 31 October 2026. This file is the current-state authority. The current summary and remaining gates below take precedence over dated historical checkpoints, which are retained at the end for traceability.

## Main resilience candidate — 31 October 2026

PR #316 adds Main **pilot.10** source, encrypted BLE runtime fallback, Ethernet/Wi-Fi priority switching, SD write-ahead/replay receipts, highest-priority power/storage events and an owner-only feature settings page. Candidate details and limits: [Main resilience and settings](docs/current/MAIN-RESILIENCE-AND-FEATURE-SETTINGS.md). The merged baseline below remains pilot.9; no field upgrade or physical acceptance is implied by this candidate.

The owner page distinguishes saved and applied revisions, retains reason/actor history and prevents disabling every link. Optional local platform switches cover reports, calibration, notification dispatch, backups and client updates; existing per-channel/cloud controls remain on their own pages. Power inputs default to unwired/unknown. Actual backup circuitry, USB BLE adapter/Windows service access, 5/10 m range, changeover timing, SD faults and full-load endurance remain unqualified. Autonomous GSM alarm fallback remains open. Tester candidate is **0.7.0**; qualification becomes **HQT-3 / 21 steps** for new runs; previously saved evidence keeps its frozen plan.

## Integrated security source — 29 October 2026

PR #313 is merged at `6e43f7c7822dff9c576ebd4678eaf9740eb7d311`. All nine workflows on reviewed head `acf2b6eaaf0fe47f116f45dfe47d55b787492bbd` passed, including complete Windows Setup install/update/restore/New Install, native certificate rotation/failure recovery, both Main layouts, Tester and mobile workflows. Distributed CI binaries identify the tested PR merge `93c68a6a4a077f089b3aff6e3982a7afe167e462`; these are tested Pilot builds, not a new tagged release or physical acceptance.

Current source: product 0.20.0, Main pilot.9, Nano bench.2, Tester 0.6.2. Protected D1 deployment and Windows certificate/trust maintenance tools are ready; no remote migration/deployment, live-PC certificate replacement, owner production-key creation or eFuse activation was performed. Each mobile dependency tree retains 3 High/5 Low affected Expo-tooling entries. Full device PKI/mTLS, NVS/console security policy, key custody and designated-board recovery/manufacturing acceptance remain open. See [integration evidence](docs/security/evidence/SECURITY-INTEGRATION-2026-10-29.json) and [execution guide](docs/security/SECURITY-OPERATIONS-AR.md).

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
| Security code integration | `6e43f7c7822dff9c576ebd4678eaf9740eb7d311`, PR #313 |
| Historical audit integration | `c8d4e4f7b4a19bcc63472f8f706bc708122aa6de` |
| Historical audit candidate | `d151b1f3aba42e4c5d0ad0b34696c71db2cb7cfc`, PR #311, open at audit |
| Product source / backend / release manifest | `0.20.0` |
| Latest published tagged source release | `v0.20.0`, published 7 September 2026; not a release of the October candidate |
| Current Hardware Tester | `0.6.2` |
| Main / Nano operating firmware | `0.1.0-pilot.9` / `0.1.0-bench.2` |
| Company / customer mobile app source | Separate apps, each `0.1.0` |
| Current installed binaries / matching live Worker | Not inspected in this audit |

The documentation audit was based on candidate `d151b1f` before integration. PR #311 and #312 are now merged; no binary publication/deployment/physical acceptance follows automatically. Security remediation is now integrated through PR #313; the checkpoints above retain their earlier source/deployment boundaries. No source version bump, release or migration is performed here.

## Historical audit baseline — 28 October 2026 (superseded for remediated source findings)

Backend: 1091 tests; frontend: 354; company cloud: 27; customer mobile: 3; company mobile: 3; standalone Tester: 73. Total: **1551 routine tests**, all passed. Backend/frontend typecheck, lint, formatting and build; cloud build/dry-run; both Expo typechecks/exports; Tester report smoke; C queue and peripheral protocol host suites passed. Two additional isolated audit probes reproduced the customer authentication findings. Host runtime was Node 24.22.1/npm 11.9.0; normal backend/frontend CI specifies Node 22.

At that audit baseline, dependency scans reported Critical/High findings, and isolated probes reproduced missing customer login throttling and credential-change token invalidation. See the preserved [audit findings](docs/audit/2026-10-28/FINDINGS.md) and [dependency evidence](docs/audit/2026-10-28/DEPENDENCIES.md). These are historical findings, not a claim that the same defects remain in current main. PR #313 merged the customer-authentication and company-session fixes; its recorded backend/frontend/company-cloud all-dependency scans report zero affected entries. The nine final workflows passed. Mobile Expo-tooling advisories and production/deployment/hardware gates remain open as stated in the current summary. A successful build does not certify the installed or live system.

## Hardware responsibility and implemented limits

All new hardware qualification belongs to standalone Tester, currently 0.6.2. System Owner retains installation configuration, discovery, provisioning and device binding. Hardware Lab UI is removed; former write endpoints return HTTP 410; authenticated historical GETs and old database rows remain. There is no automatic historical database migration into Tester.

Tester includes isolated QC flash, separate operating firmware flash and an 18-step qualification checklist. Nano classic uses 57600 for upload; new bootloader uses 115200; QC runtime uses 115200. Operating Main/Nano bus uses 9600 8N1. Main has **one shared RS485 bus and up to four unique Nano addresses**, four channels each. The automated integrated scope observes **one selected Nano/four probes**. Independent full-population evidence is still required for sixteen probes.

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

