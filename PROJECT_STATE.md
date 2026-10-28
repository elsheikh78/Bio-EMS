# BIO-EMS Project State

Reviewed 28 October 2026. This is the sole current-state authority; dated evidence is preserved in [the pre-audit snapshot](docs/archive/2026-10-28-pre-audit/PROJECT_STATE.md).

## Customer security remediation candidate — 28 October 2026

User-authorized A02/A03 fixes are implemented on `fix/customer-auth-audit`, not yet merged/deployed: bounded customer login throttling; credential-bound customer tokens; old token rejection after own/admin/offline password replacement; replacement session installed by the matching frontend. Existing customer sessions must log in again on initial upgrade. Compatible lockfile updates and deliberate Nodemailer10 upgrade reduce backend/frontend production npm audit entries to zero in the candidate; development/tooling and other-component advisories remain open. Company session, Main TLS and production device-trust findings are not closed.

Local Node24 verification: backend1101 tests/164 files; frontend357 tests/64 files; typecheck/lint/format/build and documentation checks. See [remediation design and rollout](docs/security/CUSTOMER-AUTH-AUDIT-REMEDIATION.md) and [ADR-024](docs/adr/ADR-024-customer-access-token-credential-binding.md). Remote CI and source integration remain separate gates.

## Exact source and release boundary

| Item | Reviewed state |
| --- | --- |
| Merged main | `c8d4e4f7b4a19bcc63472f8f706bc708122aa6de` |
| Historical audit candidate | `d151b1f3aba42e4c5d0ad0b34696c71db2cb7cfc`, PR #311, open at audit |
| Product source / backend / release manifest | `0.20.0` |
| Latest published tagged source release | `v0.20.0`, published 7 September 2026; not a release of the October candidate |
| Merged Hardware Tester | `0.6.0` |
| Main / Nano operating firmware | `0.1.0-pilot.7` / `0.1.0-bench.2` |
| Company / customer mobile app source | Separate apps, each `0.1.0` |
| Current installed binaries / matching live Worker | Not inspected in this audit |

The documentation audit was based on candidate `d151b1f` before integration. PR #311 and #312 are now merged; no binary publication/deployment/physical acceptance follows automatically. Security remediation above is a separate unmerged candidate. No source version bump, release or migration is performed here.

## Verified during the audit

Backend: 1091 tests; frontend: 354; company cloud: 27; customer mobile: 3; company mobile: 3; standalone Tester: 73. Total: **1551 routine tests**, all passed. Backend/frontend typecheck, lint, formatting and build; cloud build/dry-run; both Expo typechecks/exports; Tester report smoke; C queue and peripheral protocol host suites passed. Two additional isolated audit probes reproduced the customer authentication findings. Host runtime was Node 24.22.1/npm 11.9.0; normal backend/frontend CI specifies Node 22.

Passing functional gates does not mean security approval. Dependency audit has **open Critical/High findings**, including a Critical affected package entry in backend production dependencies. See [audit findings](docs/audit/2026-10-28/FINDINGS.md) and [dependency evidence](docs/audit/2026-10-28/DEPENDENCIES.md). Exploitability has not been established for every advisory. Customer login throttling and credential-change token invalidation were reproduced at the audit baseline and have source fixes in the separate candidate described above; they are not yet deployed. Production approval remains blocked on security review/remediation and acceptance gates.

## Hardware responsibility and implemented limits

The candidate moves all new hardware qualification to standalone Tester 0.6.0. System Owner retains installation configuration, discovery, provisioning and device binding. Hardware Lab UI is removed; former write endpoints return HTTP 410; authenticated historical GETs and old database rows remain. There is no automatic historical database migration into Tester.

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
