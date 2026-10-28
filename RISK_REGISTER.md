# BIO-EMS Risk Register

## Customer-auth remediation candidate — 28 October 2026

A02/R-26 and A03/R-27 have source fixes and desired regression tests on `fix/customer-auth-audit`; merge/deployment remain pending. Initial upgrade requires customer re-login and matched backend/frontend rollout. Limits are process-local; restoring old credential data under the same JWT secret can resurrect matching unexpired tokens, and disable/re-enable alone is not permanent revocation. See ADR-024 and the customer-auth remediation guide. Dependencies/company sessions/Main TLS/device trust remain open.


## Current audit risks —28 October2026

| ID | Risk / evidence | Status and next action |
| --- | --- | --- |
| R-25 / A01 | Critical/High dependency advisories; production/backend includes conditional proxy-addr finding | OPEN; triage reachability, patch supported versions, rerun gates |
| R-26 / A02 | Customer login lacks application throttling | OPEN; reviewed rate-limit policy and route/proxy tests |
| R-27 / A03 | Customer token remains valid after credential replacement | OPEN; revocation/version design and all recovery-path regressions |
| R-28 / A04 | Copied company cookie survives browser logout until expiry | OPEN; decide pilot acceptance versus revocable operator sessions |
| R-29 / A05 | Main pilot skips certificate endpoint-name check | OPEN production gate; certificate/hostname provisioning and negative TLS tests |
| R-30 / A07 | Build/checklist can be mistaken for complete16-channel/field/native acceptance | OPEN; exact-population/physical/deployment evidence |
| R-31 / D01–D03 | Old status/specs/links mistaken for observed implementation | Documentation controlled; originals hashed, current guides and checker added; formal requirement traceability remains open |

[Audit findings](docs/audit/2026-10-28/FINDINGS.md) give evidence and closure criteria. Earlier R-21 main/candidate values below are historical; use PROJECT_STATE for current refs. No historical risk is closed solely because its document was archived.

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<docs/README.md>) describes the reviewed source baseline; [Project state](<PROJECT_STATE.md>) controls current status. [Original pre-audit document](<docs/archive/2026-10-28-pre-audit/RISK_REGISTER.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


## Review — 26 October 2026

- R-20: Isolated QC flashing replaces operating firmware and GPIO4 conflicts with SD. Disconnect peripherals, use the correct voltage/pull-ups, and restore governed pilot.7/bench.2 before integrated operation.
- R-21: Open #309 / Tester 0.4.0 can be confused with merged 0.3.0. Record PR/commit/package hashes and merge status; successful CI does not establish hardware acceptance.
- R-22: Integrated scans lack probe ROM, Nano unique ID and conversion-age evidence. Retain physical channel mapping/response tests; never label host counters as device uptime.
- R-23: Customer native mobile source can be mistaken for deployed/signed distribution or background alert coverage. Verify matching Worker deployment, signed builds and device acceptance; background native push is absent.
- R-24: USB initial test supply can be mistaken for full assembly power approval. Verify the controlled supply/USB topology and full-load backup test separately.

Current operating boundaries: [26 October checkpoint](docs/current/PROJECT-CHECKPOINT-2026-10-26.md). Earlier dated risks remain open unless evidence explicitly closes them.

## Current integration risks

- R-17: Main/Nano acquisition and Modbus mapping are implemented in the bench operating source but not physically qualified end to end. Autonomous 2G alarm fallback is not implemented. Close with populated-module/fault/endurance and actual delivery evidence.
- R-18: PT100 field baseline versus DS18B20 bench candidate is unresolved; El Manial six/seven count conflicts. Freeze the approved sensor map/BOM before procurement.
- R-19: Earlier ADMIN topology approval conflicts with current permission policy; Builder threshold controls are incomplete. Reconcile UI/API/product policy before operational manual acceptance.

**Review date:** 30 September 2026

| ID | Risk | Impact | Current status | Mitigation / next action |
| --- | --- | --- | --- | --- |
| R-01 | Installer lifecycle is not yet fully qualified across multiple physical PCs | High | Reduced / Open | Clean Pilot install and ADMIN login passed; still test reboot/repair/upgrade/rollback/uninstall and a second clean PC |
| R-02 | Managed provider configuration source is implemented but not yet live-accepted | High | Reduced / Open | COM-01 through COM-06 are merged through PR #239; complete COM-07 live provider acceptance |
| R-03 | WhatsApp Meta onboarding remains externally blocked | Medium | Open | Use Telegram interim path; continue Meta work in parallel |
| R-04 | SMS/GSM live delivery not yet proven | High | Open | Select/freeze transport and perform bench + Pilot failover tests |
| R-05 | Hardware controller/Sensor path not yet fully field-qualified | High | Open | Freeze BOM, bench test, calibration, power/network/endurance evidence |
| R-06 | BIO EGYPT not commissioned/accepted | High | Open | Execute field installation, commissioning and UAT after installer/hardware readiness |
| R-07 | Final Device PKI/mTLS/host-transfer architecture is approved but not implemented | High for production, Low for early Pilot | Deferred | Execute DEV-TRUST-01 through DEV-TRUST-11 after Pilot stabilization |
| R-08 | Repeated protection/certificate rework during test-machine changes could slow Pilot | Medium | Controlled | Keep final protection deferred until Setup/hardware stable |
| R-09 | Old historical documents can be mistaken for current installer/security status | Medium | Controlled | Use PROJECT_STATE + IMPLEMENTATION_PLAN + docs/README.md; dated evidence is historical |
| R-10 | Existing README contained encoding corruption/stale statements | Medium | Corrected by audit PR | Replace README with clean current authority links/status |
| R-11 | Production signing/public trust not decided | Medium for commercial release | Deferred | Decide after Pilot and final Production Installer qualification |
| R-12 | Backup/restore/DR not yet proven in production conditions | High for production | Open later gate | Execute controlled restore/rollback/DR drills before production |
| R-13 | Windows behavior may differ between customer machines | High | Open | Multi-machine installer qualification; capture OS/build/hardware evidence |
| R-14 | Real provider secrets could leak during live COM-07 acceptance | High | Preventive | Source redaction/encryption controls exist; never place live secrets in Git, screenshots, logs or audit evidence |
| R-15 | Pilot changes could regress existing Email/Telegram path | High | Reduced / Open | COM-06 automated regression source integrated through PR #239; retain live COM-07 acceptance before Pilot closure |

## Risk rule

A risk may be closed only by evidence, not by documentation or intent. Production risks may remain intentionally deferred while the Pilot is controlled, but the deferral must be explicit.

| R-16 | SEC-OWNER Production acceptance is blocked until the real manufacturer Ed25519 key ceremony and offline commissioning are executed | High for production | Open gate | Follow the Arabic manufacturer key guide; keep the private key offline and outside GitHub/CI/customer PCs; Pilot owner commissioning/MFA passed; record separate Production evidence before Production acceptance |
