# S16-07-01 — Reporting Contracts, Catalogue, and Permissions

## Status

**IMPLEMENTED / VERIFICATION COMPLETE / REVIEW PENDING**

## Approved permission decision

The Product Owner approved the reporting permission matrix on 19 August 2026:

| Role     | `REPORT_READ` | `REPORT_EXPORT` |
| -------- | ------------- | --------------- |
| ADMIN    | allowed       | allowed         |
| OPERATOR | allowed       | allowed         |
| VIEWER   | allowed       | denied          |

Backend authorization remains authoritative. The Frontend matrix mirrors it only for
presentation and route behavior.

## Implemented boundary

This slice implements the first approved S16-03 sequence item:

- `REPORT_READ` and `REPORT_EXPORT` permission vocabulary and role mapping;
- authenticated `GET /api/v1/reports/catalogue` protected by `REPORT_READ`;
- reporting contract version `1.0`;
- five approved report-family identities and readiness states;
- approved preview, raw CSV, aggregated, and record-range/result limits;
- a strict Frontend Zod contract, API adapter, and TanStack Query boundary;
- authorization, route, and contract tests.

## Capability truthfulness

The Catalogue advertises no preview or export as currently available. Every family has
`previewAvailable: false` and an empty `exportFormats` list until its adapter and
renderer are implemented and verified.

Readiness is declared as:

| Report family        | Catalogue readiness      | Current blocker                              |
| -------------------- | ------------------------ | -------------------------------------------- |
| Temperature          | PARTIAL                  | approved range-query contract implementation |
| Alarm History        | PARTIAL                  | lifecycle/read-projection correction         |
| Calibration History  | READY_FOR_IMPLEMENTATION | preview adapter not implemented              |
| Device Health        | BLOCKED                  | persistent transition/history ledger         |
| Audit and Operations | BLOCKED                  | general append-only audit store              |

No current snapshot is presented as historical proof.

## Verification evidence

- Backend typecheck, lint, formatting, and build: PASS;
- Frontend typecheck, lint, formatting, and production build: PASS;
- Backend authorization matrix and reporting route tests: PASS;
- Frontend permission and Catalogue contract tests: PASS;
- `git diff --check`: PASS.

The local Vitest processes retain the known open-handle lifecycle after emitting
successful focused-test results; CI remains the final merge gate.

## Next implementation slice

S16-07-02 should implement the canonical Calibration History preview request/result
contract and backend adapter because authoritative immutable calibration records already
exist. PDF and CSV remain unavailable until preview/result equality is proven.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.
