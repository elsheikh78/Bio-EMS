# BF-01 — SYSTEM_OWNER Authorization Boundary Closure

Status: IMPLEMENTED / LOCAL QUALITY GATES PASS / PR PENDING
Date: 2026-08-24
Branch: `agent/bf-01-system-owner-boundary`
Base: `main` at `47bdf03510613380eb5ebafb13f4c093bbdc84f6`
Related issue: #65

## 1. Objective

Introduce a platform-level `SYSTEM_OWNER` identity above customer `ADMIN` while
preserving a strict server-side separation from customer authentication,
authorization, and User Management.

## 2. Implemented scope

- Added explicit platform-principal contracts containing only `SYSTEM_OWNER`.
- Added SQLite migration 009 with isolated `platform_principals` credential storage,
  normalized unique username enforcement, active/disabled lifecycle, and a singleton
  database constraint.
- Kept customer roles limited to `ADMIN`, `OPERATOR`, and `VIEWER`.
- Added a repository boundary that never exposes password hashes from public lookup.
- Added a separate platform JWT configuration with independent secret, issuer,
  audience, expiry, and explicit platform-only claims.
- Added `POST /api/v1/platform-auth/login` and
  `GET /api/v1/platform-auth/me` outside customer authentication middleware.
- Added active persisted-principal verification on every protected platform request.
- Added a one-time environment-driven `bootstrap:system-owner` backend command using
  the approved password validation and bcrypt-hashing service.
- Added strict single-`Authorization` header enforcement shared by customer and
  platform authentication.

## 3. Security boundary

- No hard-coded master password, universal password, backdoor credential, plaintext
  credential, or frontend-embedded secret exists.
- Customer User Management cannot enumerate the platform table or create, assign,
  edit, disable, delete, reset, or impersonate `SYSTEM_OWNER`.
- A customer access token cannot satisfy platform token verification because the
  trust domains and claims are separate.
- Platform authentication is unavailable and returns a controlled 503 response when
  the platform JWT trust domain is not configured.
- Disabled or missing platform principals invalidate previously issued platform
  tokens at request time.
- Bootstrap failure is generic and does not print submitted credentials or hashes.

## 4. REST contracts

### `POST /api/v1/platform-auth/login`

Accepts a strict normalized username/password body. Successful responses contain an
isolated bearer access token and sanitized platform principal. Invalid credentials
use the generic credential-failure contract. Invalid request bodies fail validation
before invoking the authentication service.

### `GET /api/v1/platform-auth/me`

Requires a valid platform token and an active persisted `SYSTEM_OWNER`. The response
contains only the sanitized platform principal.

## 5. Verification evidence

Backend local quality gates completed successfully after the final code and
documentation changes:

- TypeScript typecheck: PASS;
- production build: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 60 files / 522 tests PASS.

Frontend regression gates completed successfully after one transient test rerun:

- TypeScript typecheck: PASS;
- ESLint: PASS;
- Prettier check: PASS;
- Vitest: 25 files / 212 tests PASS;
- production build: PASS.

GitHub CI, PR review, and merge evidence remain pending and must be appended after the
PR lifecycle completes.

## 6. Explicitly deferred

BF-01 does not implement or claim completion of:

- MFA/TOTP or equivalent second-factor authentication;
- rate limiting, failed-login lockout, or production session controls;
- a frontend Owner Portal or discoverability behavior;
- customer lifecycle, licensing, support, update, cross-customer, or other commercial
  owner permissions;
- append-only system-wide audit persistence or owner action audit integration;
- customer/API-driven platform-owner creation or credential management.

These are not hidden assumptions. They remain gated follow-up scope, including BF-02
for the audit foundation.

## 7. Documentation audit result

- Architecture baseline: aligned with implemented/deferred distinction.
- Work package acceptance criteria: mapped to implementation and tests.
- README API and secure bootstrap operations: documented.
- Changelog: recorded under Unreleased without changing published `v0.15.0`.
- Project state/status: BF-01 identified as feature-branch work pending integration.
- BIO EGYPT status: stale BE-001 references corrected; BE-001 remains closed while
  BE-002 through BE-012 remain open.

## 8. Integration gate

BF-01 may be declared PR-ready only after the final backend and frontend quality
gates pass on the documented commit, the branch remains zero commits behind current
`main`, and the GitHub diff contains no unrelated or runtime-generated files.
