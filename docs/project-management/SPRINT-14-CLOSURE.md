# Sprint 14 Closure — Frontend Application

## Status

**CLOSED / MERGED / VERIFIED**

Sprint 14 is complete.

All approved Sprint 14 implementation slices have been completed, reviewed, validated, and integrated into `main`.

The final Sprint 14 integration was completed through S14-05 Monitored Areas in PR #19.

Final Sprint 14 `main` integration commit:

`2f79609ce8f79ac22ce06c12d9cf08c19a9a8207`

---

## Sprint Objective

Sprint 14 established the first coherent BIO-EMS frontend application foundation on top of the existing backend platform.

The Sprint focused on building the authenticated application shell and operational frontend foundations required to expose existing BIO-EMS backend capabilities safely and consistently.

Sprint 14 did not attempt to complete every production feature required for customer deployment.

Pilot deployment readiness remains a separate post-Sprint-14 workstream.

---

## Completed Sprint 14 Scope

Sprint 14 was delivered through the following approved implementation slices:

### S14-01 — Frontend Foundation

**Status: COMPLETE / MERGED**

Established the frontend engineering foundation required for subsequent Sprint 14 work.

This included the initial frontend structure, application foundations, testing conventions, and supporting engineering configuration.

---

### S14-02 — Application Shell

**Status: COMPLETE / MERGED / VERIFIED**

Established the BIO-EMS application shell and primary frontend navigation structure.

The shell provides the structural foundation for authenticated application pages and subsequent operational frontend features.

---

### S14-03 — Authentication and Session Boundary

**Status: COMPLETE / MERGED / VERIFIED**

Established the frontend authentication/session boundary and protected-request behavior.

The completed implementation includes protection against stale protected responses and generation-scoped session invalidation.

Authentication, authorization, protected routing, and protected API behavior are covered by the repository regression suite.

---

### S14-04 — Operational Dashboard

**Status: COMPLETE / MERGED / VERIFIED**

Replaced the dashboard placeholder with the first operational BIO-EMS dashboard experience.

The dashboard consumes the approved existing backend contracts without introducing a parallel frontend domain model.

S14-04 established the operational presentation patterns reused by later frontend work.

---

### S14-05 — Monitored Areas

**Status: COMPLETE / MERGED / VERIFIED**

S14-05 replaced the `/monitored-areas` placeholder with an operational read-only monitored-area hierarchy.

Approved presentation hierarchy:

**Site → Monitored Area (Room) → Sensor**

`Monitored Area` is frontend presentation terminology for the existing backend Room domain.

No new Area domain was introduced.

S14-05 was implemented through four internal slices.

#### S14-05A — Contracts and Data Access

Completed:

- strict frontend contracts for Site, Room, and Sensor payloads;
- Monitored Areas API access using the existing protected-request boundary;
- React Query keys and feature queries;
- focused contract, API, and query coverage.

#### S14-05B — Site and Monitored Area Hierarchy

Completed:

- operational `/monitored-areas` page;
- Site → Monitored Area hierarchy;
- Sensor association with the correct Monitored Area;
- configuration-state presentation;
- empty-state handling;
- localization integration;
- responsive presentation;
- focused hierarchy tests.

#### S14-05C — Sensor Inventory and Threshold Configuration

Completed:

- Sensor inventory presentation;
- Sensor identification and configuration metadata;
- configured threshold presentation for:
  - `min_value`;
  - `warning_low`;
  - `alarm_low`;
  - `warning_high`;
  - `alarm_high`;
  - `max_value`;
- engineering-unit presentation;
- explicit handling of missing or partial threshold configuration;
- separation of configured thresholds from live telemetry and current alarm state;
- localization and regression coverage.

#### S14-05D — Refresh, Retry, Integration, and Hardening

Completed:

- explicit page-level refresh;
- coordinated Site, Room, and Sensor re-fetch;
- duplicate-refresh prevention;
- explicit retry behavior after resource failure;
- localized Refresh, Refreshing, and Retry states;
- focused refresh/retry regression coverage;
- final integration and hardening review.

---

## S14-05 Integration Evidence

Feature branch:

`agent/s14-05-monitored-areas`

Final feature-branch commit before merge:

`19a7e49acb4b0b224aa71d085fd741e2bcadd87e`

Pull Request:

**PR #19 — `feat(frontend): complete S14-05 monitored areas`**

PR #19 contained:

- 5 commits;
- 12 changed files;
- S14-05 implementation and associated progress documentation.

The final review found no blocking code or scope issue.

GitHub reported the PR as mergeable.

CI completed successfully before merge.

PR #19 was subsequently merged into `main`.

Merge commit:

`2f79609ce8f79ac22ce06c12d9cf08c19a9a8207`

Local `main` and `origin/main` were subsequently synchronized and verified at the same commit.

---

## Quality and Validation

Sprint 14 implementation was developed behind the repository quality gates.

The final S14-05 integration passed the applicable frontend quality gates, including:

- TypeScript typecheck;
- ESLint;
- Prettier / formatting validation;
- frontend automated tests;
- production build;
- focused Monitored Areas regression testing.

GitHub CI for PR #19 completed successfully.

Both frontend and backend CI quality gates passed before the final S14-05 merge.

The existing Vite production-build chunk-size advisory remains non-blocking and is not a Sprint 14 closure blocker.

---

## Architecture Preserved

Sprint 14 preserved the existing BIO-EMS backend architecture.

In particular, Sprint 14 did **not** introduce a parallel frontend domain for Monitored Areas.

The existing backend hierarchy remains authoritative.

For S14-05:

- Site remains Site;
- Room remains the backend domain represented to users as Monitored Area;
- Sensor remains Sensor;
- Room → Site continues through `site_id`;
- Sensor → Room continues through `room_id`.

Sprint 14 also did not require changes to the established backend:

- database schema;
- database migrations;
- MQTT ingestion;
- telemetry ingestion pipeline;
- alarm-domain engine;
- device lifecycle model.

---

## Sprint 14 Product Outcome

At Sprint 14 closure, BIO-EMS has moved beyond a backend-only engineering foundation and now has an integrated frontend application foundation that includes:

- application shell;
- navigation;
- authentication/session handling;
- authorization boundaries;
- protected API access;
- operational dashboard;
- operational Monitored Areas hierarchy;
- Sensor configuration visibility;
- configured threshold visibility;
- refresh/retry behavior;
- localization foundations;
- frontend regression coverage.

This represents a major application-level integration milestone.

It does **not**, by itself, declare BIO-EMS ready for customer Pilot deployment.

---

## Explicitly Not Declared Complete by Sprint 14

Sprint 14 closure must not be interpreted as completion of the full BIO-EMS commercial product.

The following areas require formal evaluation during Pilot Readiness rather than being assumed complete:

- production deployment topology;
- customer-site installation workflow;
- hardware readiness;
- gateway/device commissioning;
- Sensor commissioning;
- real customer telemetry validation;
- network-loss and recovery behavior under Pilot conditions;
- operational alarm delivery requirements;
- notification/escalation requirements;
- user/role requirements needed by the Pilot customer;
- calibration workflow and calibration evidence requirements;
- auditability requirements;
- reporting/export requirements;
- backup and recovery requirements;
- operational logging and diagnostics;
- security hardening required for deployment;
- installer/update strategy;
- Pilot acceptance criteria;
- customer handover and support procedures.

Items in this list are **Pilot Readiness review subjects**.

Their presence here does not automatically mean that each requires new implementation.

The Pilot Readiness Review must determine which capabilities already exist, which require configuration or validation, and which represent genuine implementation gaps.

---

## Scope Control

No additional feature Sprint should be opened solely because a possible Pilot requirement has been identified.

The next phase must first compare:

1. the actual current BIO-EMS capability;
2. the target Pilot customer's operational requirements;
3. hardware and deployment requirements;
4. regulatory or quality expectations applicable to the Pilot;
5. the minimum acceptance criteria required for successful commissioning.

Only verified gaps should generate additional implementation work.

This prevents unnecessary scope expansion and protects the Pilot schedule.

---

## Documentation Reconciliation

Sprint 14 closure requires the repository status documents to be reconciled with the completed implementation.

The following documents are part of that reconciliation:

- `docs/project-management/SPRINT-14-PLAN.md`;
- `docs/project-management/SPRINT-14-S14-05-PROGRESS.md`;
- `docs/project-status.md`;
- `docs/SPRINT_PROGRESS.md`;
- `docs/project-management/SPRINT-14-CLOSURE.md`.

After reconciliation, no authoritative project-status document should continue to describe:

- Sprint 14 as in progress;
- S14-05C as not started;
- S14-05D as pending;
- S14-05 as unmerged.

---

## Final Sprint 14 State

**Sprint 14: CLOSED**

**S14-01: COMPLETE**

**S14-02: COMPLETE**

**S14-03: COMPLETE**

**S14-04: COMPLETE**

**S14-05: COMPLETE**

**PR #19: MERGED**

**CI: PASSED**

**Local `main` = `origin/main`: VERIFIED**

---

## Next Phase

The immediate project phase after Sprint 14 is:

# BIO-EMS Pilot Readiness Review

The purpose of the review is to establish the shortest controlled path from the current integrated BIO-EMS platform to a deployable Pilot system for the waiting customer.

The review must identify and classify each requirement as one of:

- already implemented and ready;
- implemented but requiring validation;
- configuration required;
- deployment/hardware work required;
- documentation/procedure required;
- genuine software gap.

Only after this classification should additional implementation scope be approved.

Until that review is complete, unnecessary feature expansion is deferred.