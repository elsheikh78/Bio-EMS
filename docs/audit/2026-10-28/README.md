# BIO-EMS Code and Documentation Audit — 28 October 2026

**Outcome: routine software gates pass; security and physical/field acceptance remain open.** This audit refreshes the documentation and records actionable defects. It does not silently patch authentication/dependencies, approve production, publish a binary, deploy cloud code or merge the reviewed candidate.

## Baseline and scope

Reviewed candidate: `d151b1f3aba42e4c5d0ad0b34696c71db2cb7cfc` (PR #311, open at audit). Reviewed main: `a9eaa909e3564c0a62b70ceb5bbc5590740b0e57`. Candidate includes standalone Tester 0.6.0 and hardware-lab retirement; main is still Tester 0.4.0. Product version remains 0.20.0; the published v0.20.0 release is the September tag, not this candidate.

Repository inventory covers 1207 tracked files and 309 text documents (build/dependency `.txt` configs excluded). Every original document is classified and recoverable with SHA-256. Targeted manual code review covered authentication, session/recovery, owner boundaries, app/router mounting, cloud auth/viewer, native navigation/API, device telemetry, firmware transport/queue and Tester qualification/evidence. Component-wide tests/builds and dependency scans supplement that review. **This is a repository-wide engineering audit, not exhaustive line-by-line verification, a penetration test or a regulatory certification.**

## Key results

- 1551 routine tests passed across six components; backend/frontend type/lint/format/build, cloud build/dry-run, two Expo exports, Tester report smoke and two C host suites passed.
- Two extra isolated audit probes reproduced customer-login throttling and post-credential-change token-lifetime gaps. These are observations of current defects, not desired security behavior.
- Dependency scans report Critical/High affected package entries. Backend production includes one Critical entry (`proxy-addr`), whose advisory depends on unsafe trust-subnet configuration; that configuration was not found in the reviewed app. Do not equate the advisory label with a demonstrated application exploit. Other runtime and development advisories still need triage/upgrades.
- Main pilot HTTPS clients skip endpoint-name checks while using provisioned certificates. Company cloud sessions are stateless and a copied cookie is not individually revoked by logout. Full production device trust remains deferred.
- Historical status/CI counts and planned capabilities were interleaved with current docs. Current authority is now compact; originals remain intact and old work-package entrypoints point to history/current guides. ADRs and active requirements were retained rather than retrospectively rewritten as implemented.

## Read the audit

| Record | Contents |
| --- | --- |
| [Findings](FINDINGS.md) | Priorities, evidence, impact, recommended closure tests |
| [Verification](VERIFICATION.md) | Actual executed gates, counts and environment limitations |
| [Dependencies](DEPENDENCIES.md) | Production versus all-dependency counts, package/advisory details |
| [Coverage](COVERAGE.md) | What each area received and what remains unverified |
| [Documentation migration](DOCUMENTATION-MIGRATION.md) | Classification, archive integrity, reference corrections |
| [Source inventory](source-inventory.json) | 1207 original tracked files, sizes and SHA-256 |
| [Document inventory](document-inventory.json) | 309 originals, role, archive location and current reference |
| [Route inventory](api-route-inventory.json) | Literal Express declarations; no OpenAPI/completeness claim |
| [Evidence directory](evidence/README.md) | Sanitized gate/advisory/probe evidence |

[PROJECT_STATE](../../../PROJECT_STATE.md) remains the only current-state ledger. [Current implementation guides](../../current/README.md) describe observed behavior and operating limits. Recommended remediation ordering is recorded in findings and the approved plan, without implementing new product behavior during this documentation refresh.
