# P3-03 Codex Handoff — Protected Site-scoped Commissioning API

**Date:** 1 September 2026  
**Repository:** `elsheikh78/Bio-EMS`  
**Phase:** P3 Pilot Commissioning Tooling  
**Work package:** P3-03 Protected Site-scoped Commissioning API  
**Branch:** `agent/p3-03-commissioning-api`  
**Pull request:** #130 — `feat(p3): add protected commissioning API`  
**Base:** `main` at P3-02 merge `5b17b827cc22170112cc4e3dd8f409aa8669c7d7`  
**Status at handoff:** IMPLEMENTED / CI VERIFIED / PR REMAINS DRAFT FOR CODEX REVIEW

## 1. Authoritative continuation rule

GitHub is the source of truth. Before Codex changes code, fetch the remote branch and verify the local working tree is clean. Do not discard or apply the existing local stash unless explicitly required. The stash contains local-only test scripts and must remain preserved.

Known stash contents from the Windows working copy:

- `backend/check-sensors.cjs`
- `backend/src/scripts/bioems-temperature-scenario.js`

Known stash label:

`local test scripts before P2`

## 2. P3 status entering this work package

P3-01 Commissioning Evidence Foundation is complete. P3-02 Commissioning Session Domain/Persistence is merged and CI verified in `main` through merge commit `5b17b827cc22170112cc4e3dd8f409aa8669c7d7`.

P3-02 established:

- durable commissioning sessions;
- commissioning checks;
- append-only evidence;
- append-only deviations;
- append-only decisions;
- controlled evidence provenance;
- commissioning acceptance-domain rules;
- physical/live evidence boundaries;
- durable SQLite migration and repository tests.

P3-03 exposes this domain through a protected Site-scoped API without claiming that physical commissioning, live-provider execution, BIO EGYPT field completion, customer UAT/sign-off, or customer acceptance has occurred.

## 3. P3-03 implementation completed on the branch

### Authorization

Added dedicated permissions:

- `COMMISSIONING_READ`
- `COMMISSIONING_MANAGE`

Role behavior:

- ADMIN: read + manage;
- OPERATOR: read + manage;
- VIEWER: read only.

Authorization policy tests were extended accordingly.

### Protected API routes

The commissioning router is mounted behind the existing global authentication middleware.

Implemented routes:

- `POST /sites/:siteId/commissioning-sessions`
- `POST /sites/:siteId/commissioning-sessions/:sessionId/checks`
- `POST /sites/:siteId/commissioning-sessions/:sessionId/evidence`
- `POST /sites/:siteId/commissioning-sessions/:sessionId/deviations`
- `GET /sites/:siteId/commissioning-sessions/:sessionId/deviations`
- `POST /sites/:siteId/commissioning-sessions/:sessionId/decisions`

All route parameters and request bodies use strict Zod validation.

### Scope isolation

The API enforces Site → Session ownership. Evidence writes also enforce Session → Check ownership. A commissioning session cannot be mutated through another Site path, and evidence cannot be attached to a check from another session.

### Server-controlled provenance

The initial API draft incorrectly accepted actor identity and decision snapshots from the client. This was corrected before handoff.

Current rules:

- commissioning engineer identity is derived from the authenticated BIO-EMS user;
- evidence actor identity is derived from the authenticated BIO-EMS user;
- deviation actor identity is derived from the authenticated BIO-EMS user;
- decision actor identity is derived from the authenticated BIO-EMS user;
- client-controlled `actorIdentity` fields are rejected by strict schemas;
- client-controlled decision `snapshot` is rejected;
- the server generates the decision snapshot from persisted commissioning state.

### Commissioning service orchestration

A dedicated `CommissioningService` was added. Acceptance decisions do not write directly from the controller to the repository.

For each decision the service:

1. verifies Site → Session ownership;
2. loads current check snapshots from persisted data;
3. loads persisted deviations;
4. evaluates acceptance through `evaluateCommissioningAcceptance`;
5. blocks `ACCEPTED` when any blocking reason remains;
6. persists a server-generated snapshot containing the evaluated checks, deviations, and acceptance result.

`REJECTED` decisions remain append-only and may be recorded even when acceptance gates are not satisfied.

### Current-evidence snapshot behavior

The repository now derives each check's current state from its latest evidence record while preserving the complete append-only evidence history. A check with no evidence is represented as `NOT_RUN` for acceptance evaluation.

The domain snapshot type was reconciled so a `NOT_RUN` check may have no evidence kind.

### Acceptance invariants preserved

The API cannot turn software-only evidence into physical completion.

Acceptance remains blocked when, among other controlled rules:

- a mandatory check is `NOT_RUN`, `FAIL`, or `BLOCKED`;
- a physical/live gate is marked `PASS` using `SOFTWARE_AUTOMATED` evidence;
- an invalid deferred state is used;
- a blocking deviation remains open.

Physical/live gates require `PHYSICAL` or `LIVE_PROVIDER` evidence as defined by the P3 domain model.

## 4. Tests implemented

### Service tests

`backend/src/modules/commissioning/commissioning.service.spec.ts` covers the orchestration/acceptance behavior, including:

- mandatory `NOT_RUN` blocking acceptance;
- physical/live evidence gating;
- accepted decision snapshot generation from persisted state;
- cross-Site isolation.

### Route tests

`backend/src/routes/tests/commissioning.route.spec.ts` covers protected route behavior including:

- ADMIN/OPERATOR mutation access;
- VIEWER read-only access;
- provenance input rejection;
- request validation and protected route behavior.

### Authorization tests

`backend/src/authorization/tests/authorization.policy.spec.ts` was extended for the new commissioning permissions.

## 5. Files changed by P3-03

Compared with the P3-02 base, the branch changes these controlled files:

- `PROJECT_STATE.md`
- `backend/src/app.ts`
- `backend/src/authorization/authorization.policy.ts`
- `backend/src/authorization/permissions.ts`
- `backend/src/authorization/tests/authorization.policy.spec.ts`
- `backend/src/controllers/commissioning.controller.ts`
- `backend/src/modules/commissioning/commissioning.domain.ts`
- `backend/src/modules/commissioning/commissioning.repository.ts`
- `backend/src/modules/commissioning/commissioning.schema.ts`
- `backend/src/modules/commissioning/commissioning.service.spec.ts`
- `backend/src/modules/commissioning/commissioning.service.ts`
- `backend/src/routes/commissioning.route.ts`
- `backend/src/routes/tests/commissioning.route.spec.ts`
- this handoff document.

## 6. CI history and resolved failures

Normal `.github/workflows/ci.yml` remains the verification path; no temporary workflow should be introduced.

Resolved during P3-03:

1. route parameter schemas originally coerced IDs to numbers and conflicted with the generic `validateParams` string-record contract; fixed by validating positive integer strings and converting in controllers;
2. Prettier initially rejected the commissioning controller/repository; formatting was corrected during implementation;
3. the first current-snapshot implementation allowed `undefined` evidence kind while the domain type required a value; the domain snapshot contract was corrected because `NOT_RUN` legitimately has no evidence kind.

At handoff, PR #130 head `2f0cf5d9abb4d4b7f82ddd3c257e560d6bdd4b9b` passed normal CI run #434 (`33518795276`) successfully before this documentation-only handoff commit.

After this document commit, Codex must verify the newest branch head with the normal CI again before merge.

## 7. PR state

PR #130 is intentionally still DRAFT at handoff. It is mergeable and has no known functional blocker from the last successful CI head.

Codex should perform a final source review, run/verify normal CI on the newest documentation head, then mark ready and merge only if all quality gates remain green.

## 8. Required Codex continuation sequence

1. Read `PROJECT_STATE.md`.
2. Read `IMPLEMENTATION_PLAN.md`.
3. Read `docs/project-management/P3-01-COMMISSIONING-EVIDENCE-FOUNDATION-2026-09-01.md`.
4. Read this handoff file.
5. Inspect PR #130 diff rather than reimplementing P3-03 from scratch.
6. Verify Backend and Frontend quality gates on the newest branch head.
7. Correct any regression found by review/CI.
8. Confirm server-controlled provenance and acceptance snapshot behavior remain intact.
9. Confirm Site → Session and Session → Check isolation.
10. Keep physical/live/customer evidence explicitly external.
11. Mark PR #130 ready and merge only after clean final verification.
12. Update `PROJECT_STATE.md` after merge to mark P3-03 COMPLETE / MERGED / CI VERIFIED.
13. Continue with P3-04 Configuration, Sensor Mapping and Calibration Verification.

## 9. Known separate follow-up outside P3-03

A P2 bench-qualification semantic hardening item remains known: final `QUALIFIED` must not be obtainable solely from `AUTOMATED_PASS` evidence if the controlled bench qualification requires physical evidence. Keep this as a separate focused change rather than silently mixing it into P3-03 unless a final review proves direct dependency.

## 10. External evidence boundary

Nothing in P3-03 proves or claims:

- physical controller qualification;
- industrial DS18B20 field installation;
- SIM800L live SMS delivery;
- deployed MQTT endurance/recovery;
- 72-hour physical endurance completion;
- BIO EGYPT commissioning;
- BIO EGYPT customer UAT/sign-off;
- customer or production acceptance.

Those remain controlled external evidence gates.
