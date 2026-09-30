# BF-02 — Append-only Audit Foundation Closure

Status: COMPLETE / MERGED / CI VERIFIED / CLOSED
Date: 2026-08-24
Branch: `agent/bf-02-audit-foundation`
Base: `main` at `85a2d51f8d6887605c6a3390281a690966d4f391`

## 1. Objective

Establish one append-only, redacted audit-event contract that supports customer
ADMIN Site-scoped reads and separately authenticated platform cross-Site reads
without coupling BF-02 to a specific mutation family.

## 2. Implemented scope

- Added SQLite migration 010 for actor, action, target, Site, result, prior/new
  values, request/session/correlation context, reason, and authoritative timestamps.
- Added database triggers that reject updates and deletes.
- Added repository append/read operations with deterministic
  `occurred_at DESC, id DESC` ordering and bounded result limits.
- Added a service that owns UUID and time generation and redacts sensitive material
  before calling persistence.
- Added `AUDIT_READ` to ADMIN only.
- Added `GET /api/v1/audit-events` with required positive `site_id` and optional
  `limit` from 1 through 500.
- Added `GET /api/v1/platform-audit-events` with isolated platform authentication,
  optional positive `site_id`, and the same bounded limit.

## 3. Security and evidence properties

- There is no public audit write endpoint.
- Customer OPERATOR and VIEWER access is denied.
- Customer reads cannot omit Site scope.
- Customer tokens cannot satisfy the platform read boundary.
- Sensitive semantic keys are recursively replaced with `[REDACTED]`.
- Bearer credentials, bcrypt hashes, private-key material, and recognized
  credential assignments in values or free text are redacted before persistence.
- Circular structured values fail before insertion.
- Duplicate IDs fail and direct SQL update/delete attempts are rejected.

Callers remain responsible for supplying structured semantic fields and never
intentionally passing plaintext credentials. Redaction is defense in depth; an
arbitrary unlabeled string cannot always be distinguished from valid business data.

## 4. Verification evidence

Backend gates after implementation:

- TypeScript typecheck: PASS;
- production build: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 63 files / 540 tests PASS.

Frontend source is unchanged from `main`. TypeScript, ESLint, Prettier, production
build, and the complete 25-file / 212-test suite passed on the final documented tree.

## 5. Explicitly deferred

- BF-03 User Management event production;
- integration of all other existing mutation families;
- Owner Portal audit UI;
- audit retention, archival, export, signing, and external SIEM delivery;
- multi-customer ownership modeling beyond the current explicit Site scope;
- cursor pagination and advanced audit search/filtering.

## 6. Documentation audit

- README capability, API, and security boundaries: aligned.
- Changelog Unreleased entry: aligned without changing published `v0.15.0`.
- Project status and sprint progress: BF-01 merged state and BF-02 branch state aligned.
- Product decisions: customer/platform scope and incremental producer integration recorded.
- Arabic product guide: audit foundation distinguished from remaining producer work.
- BIO EGYPT commissioning/acceptance status: unchanged and not claimed.

## 7. Integration gate

The final backend and frontend gates passed, the branch was current with `main`, and
the GitHub diff contained no unrelated/generated files.

- PR: #68;
- GitHub feature commit: `3b50406d3ecea6cafcc598d8a94c59c3c217d612`;
- GitHub CI run number: 192 — SUCCESS;
- merge commit: `9ca22d6f5a72a155203227c7ff0a0ad5b296b516`.
