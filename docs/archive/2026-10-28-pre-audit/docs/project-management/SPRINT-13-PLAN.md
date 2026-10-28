# Sprint 13 — User Authentication and API Authorization Foundation

Status: Planned

Branch: `sprint-13-auth-foundation`

Base: `main`

Base commit: `4e4f872c080de68769a713b672c0de1e215bef05`

Previous release: `v0.12.0`

Target release: `v0.13.0`

## Goal

Establish trusted User authentication and role-based authorization for the BIO-EMS
REST API so that every non-public request is associated with an active persisted User
and sensitive operations are permitted only to approved roles.

## Rationale

BIO-EMS already exposes Site, Room, Sensor, Device, Alarm, and Dashboard REST APIs.
Sprint 12 completed the Device lifecycle and telemetry trust boundary, but REST
requests are not associated with a User identity and the management surface is not
protected by authentication or authorization.

Authentication is required by the non-functional requirements, and the business rules
require Device registration to be performed by authorized Users. This foundation must
precede a production Frontend, User-driven Device approval, persistent security
auditing, and broader management workflows.

## Approved Product and Security Decisions

These decisions are fixed for Sprint 13:

1. The roles are exactly `ADMIN`, `OPERATOR`, and `VIEWER`.
2. Login uses `username`; `email` is optional and is not a Login identifier.
3. There is no public registration endpoint.
4. The first `ADMIN` is created by a separate environment-driven bootstrap command.
5. Passwords are hashed with `bcrypt` and plaintext passwords are never persisted.
6. Sprint 13 issues access tokens only; there is no Refresh Token.
7. The default access-token lifetime is 30 minutes and is configurable by environment.
8. Every authenticated request resolves the User from SQLite and verifies that the
   User still exists and has `active` status.
9. Disabling or deleting a User prevents their previously issued access tokens from
   succeeding on the next request.
10. All `/api/v1/**` REST routes are protected by default.
11. The only public REST routes are Health and Login. Any additional exception requires
    an explicit decision and regression test.
12. Sprint 13 is single-tenant per installation; tenant data and multi-tenancy are
    deferred.
13. A sanitized User identity is made available on the Express request.
14. Sprint 13 does not implement a persistent audit log or historical audit trail.
15. Passwords, access tokens, and password hashes must never be logged.
16. MQTT Device authentication is unchanged and does not use User JWTs.

## Scope

### In Scope

- Route characterization and a complete actual-route authorization inventory.
- A versioned, ordered, and idempotent SQLite User migration.
- A minimal User domain, repository, service, and strict validation contracts.
- Password hashing and verification using `bcrypt` only.
- A separate environment-driven command to bootstrap the first `ADMIN`.
- A public username/password Login endpoint.
- Signed JWT access tokens with mandatory expiry and a 30-minute default.
- Authentication middleware with a persisted active-User lookup on every request.
- A sanitized authenticated principal on the Express request.
- Role-based authorization using `ADMIN`, `OPERATOR`, and `VIEWER`.
- Default authentication for all `/api/v1/**` routes except Health and Login.
- Minimum ADMIN-only User management required to operate the authentication system.
- Stable `400`, `401`, `403`, `404`, and `409` error behavior.
- Repository, service, middleware, route, integration, security, and regression tests.
- Operational documentation and final validation.
- Version and CHANGELOG updates only during the approved Sprint closure phase.

### Out of Scope

- Public User registration.
- Frontend, Login UI, or authentication shell.
- Refresh tokens, refresh-token rotation, or a token revocation store.
- Password reset, forgotten-password flow, email verification, or invitations.
- MFA, OAuth, OIDC, SSO, LDAP, or an external identity provider.
- Tenant tables, tenant ownership, or customer isolation.
- Persistent audit logs, historical audit trails, or a security-event engine.
- MQTT Device authentication, certificates, mTLS, or MQTT topic changes.
- Telemetry payload, ingestion, storage, query, or trust-policy changes.
- Device discovery, QR processing, activation codes, provisioning, or pairing.
- Assets, Monitoring Points, Notification Engine, OTA, deployment, or licensing.
- A new Alarm resolution capability or any other new Alarm lifecycle operation.
- SQLite changes unrelated to the User authentication foundation.
- `npm audit` remediation or unrelated dependency changes.

## Existing and Proposed Route Inventory

The inventory below is derived from `backend/src/app.ts` and the current route files.
It distinguishes existing routes from Sprint 13 proposals.

| Area | Route | Status before Sprint 13 |
|---|---|---|
| Health | `GET /api/v1/health` | Existing; approved public exception |
| Sites | `GET /api/v1/sites` | Existing; protected in Sprint 13 |
| Sites | `POST /api/v1/sites` | Existing; protected in Sprint 13 |
| Rooms | `GET /api/v1/rooms` | Existing; protected in Sprint 13 |
| Rooms | `POST /api/v1/rooms` | Existing; protected in Sprint 13 |
| Sensors | `GET /api/v1/sensors` | Existing; protected in Sprint 13 |
| Sensors | `POST /api/v1/sensors` | Existing; protected in Sprint 13 |
| Devices | `GET /api/v1/devices` | Existing; protected in Sprint 13 |
| Devices | `POST /api/v1/devices` | Existing; protected in Sprint 13 |
| Devices | `GET /api/v1/devices/:deviceId` | Existing; protected in Sprint 13 |
| Devices | `PATCH /api/v1/devices/:deviceId` | Existing; protected in Sprint 13 |
| Devices | `POST /api/v1/devices/:deviceId/activate` | Existing; protected in Sprint 13 |
| Devices | `POST /api/v1/devices/:deviceId/disable` | Existing; protected in Sprint 13 |
| Alarms | `GET /api/v1/alarms` | Existing; protected in Sprint 13 |
| Alarms | `GET /api/v1/alarms/active` | Existing; protected in Sprint 13 |
| Alarms | `GET /api/v1/alarms/:id` | Existing; protected in Sprint 13 |
| Alarms | `POST /api/v1/alarms/:id/acknowledge` | Existing; `ADMIN` and `OPERATOR` allowed, `VIEWER` forbidden |
| Dashboard | `GET /api/v1/dashboard/summary` | Existing; protected in Sprint 13 |
| Dashboard | `GET /api/v1/dashboard/latest-telemetry` | Existing; protected in Sprint 13 |
| Dashboard | `GET /api/v1/dashboard/rooms/status` | Existing; protected in Sprint 13 |
| Dashboard | `GET /api/v1/dashboard/alarm-statistics` | Existing; protected in Sprint 13 |
| Authentication | `POST /api/v1/auth/login` | Proposed Sprint 13 public route |
| Users | Approved ADMIN management routes | Proposed Sprint 13 routes; exact surface fixed below |

Alarm acknowledgment is an existing capability allowed to `ADMIN` and `OPERATOR` and
forbidden to `VIEWER`. The acknowledging User ID must be recorded with the
acknowledgment, while the complete persistent Audit Log remains deferred. Alarm
resolution has no current REST route and is not created in Sprint 13.

## Authorization Matrix

| العملية | ADMIN | OPERATOR | VIEWER |
|---|---:|---:|---:|
| قراءة المواقع والغرف والحساسات | نعم | نعم | نعم |
| قراءة الأجهزة وبيانات Telemetry | نعم | نعم | نعم |
| قراءة Dashboard والإنذارات | نعم | نعم | نعم |
| إنشاء وتعديل المواقع والغرف والحساسات | نعم | لا | لا |
| إنشاء الأجهزة وتعديل metadata | نعم | نعم | لا |
| تفعيل وتعطيل الأجهزة | نعم | نعم | لا |
| إدارة المستخدمين والأدوار | نعم | لا | لا |
| تعطيل المستخدمين | نعم | لا | لا |

This capability matrix must be converted into a mapping for every actual route in the
route inventory before authorization implementation. It must not invent update routes
for Sites, Rooms, or Sensors that do not currently exist.

The existing Alarm acknowledgment route is allowed to `ADMIN` and `OPERATOR` and is
forbidden to `VIEWER`. No new acknowledgment or resolution capability is introduced by
this Sprint.

## Proposed User Persistence Contract

The minimum User record is expected to contain:

- Stable internal numeric identifier.
- Unique `username` used for Login.
- Optional `email` not used for Login.
- `password_hash` containing only a bcrypt hash.
- Role constrained to `ADMIN`, `OPERATOR`, or `VIEWER`.
- Status supporting at least `active` and `disabled`.
- Creation and update timestamps consistent with current SQLite conventions.

The migration must be ordered, idempotent, tested on fresh and previously migrated
databases, and must not silently create an administrator.

## Authentication Contract

### Login

`POST /api/v1/auth/login` is a proposed Sprint 13 route and the only proposed new
public route. It accepts a strictly validated username and password body. Its approved
success response is:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

The response contains no Refresh Token or password hash.

Unknown username, incorrect password, and disabled User use the same generic `401`
behavior to prevent User enumeration.

### Access Token

- Bearer JWT access token only.
- Mandatory expiry, with a default lifetime of 30 minutes.
- Lifetime configurable through an approved environment variable.
- Stable persisted User identifier as the token subject.
- Minimum approved claims only.
- No password, hash, secret, token, or unnecessary personal data in claims or logs.
- Persisted status and role are authoritative; token role/status are not trusted alone.

### Per-Request Enforcement

Every protected request must verify the credential, resolve the token subject from
SQLite, require the User to exist and remain active, use the current persisted role,
and attach only a sanitized principal. Authentication failure must terminate before
the controller, service, or repository is invoked.

## HTTP Error Policy

| Condition | HTTP | Planned code |
|---|---:|---|
| Invalid or malformed Login input | 400 | `VALIDATION_ERROR` |
| Missing, malformed, invalid, or expired credential | 401 | `AUTHENTICATION_REQUIRED` |
| Unknown username, incorrect password, or inactive Login identity | 401 | `INVALID_CREDENTIALS` |
| Token User missing or inactive | 401 | `AUTHENTICATION_REQUIRED` |
| Authenticated User lacks the required role | 403 | `FORBIDDEN` |
| Requested User resource does not exist | 404 | `USER_NOT_FOUND` |
| Controlled username uniqueness conflict | 409 | `RESOURCE_ALREADY_EXISTS` |

Final envelopes and messages must follow the existing `success: false` convention and
be frozen by tests. Responses must not expose Zod issues, JWT or bcrypt internals,
SQLite messages, stack traces, passwords, hashes, tokens, or secrets.

## Minimum ADMIN User Management Scope

S13-06 provides only the approved minimum operations below. These are proposed Sprint
13 routes, not existing routes:

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{user_id}`
- `PATCH /api/v1/users/{user_id}/status`
- `PUT /api/v1/users/{user_id}/password`

All five routes are `ADMIN`-only. They do not include physical deletion, forgotten
password, email verification, self-service password change, Refresh Tokens, bulk
operations, invitations, profile management, sessions, or a general IAM system.

ADMIN User management must enforce:

- `OPERATOR` and `VIEWER` cannot access User-management operations.
- No response contains `password_hash`.
- No password mutation bypasses bcrypt.
- A User cannot use the API to escalate their own role.
- An `ADMIN` cannot disable themselves or change their own role.
- Transactional protection prevents disabling or demoting the last active `ADMIN`.
- Users are never physically deleted.

## User Stories

### S13-01 — User Domain and Persistence

**As an** administrator, **I want** secure persisted User identities, roles, and
status **so that** the platform has an authoritative source for access decisions.

- Value: establishes the security identity boundary.
- Acceptance criteria: ordered idempotent migration; unique username; optional email;
  constrained role/status; no plaintext persistence; fresh and upgrade paths pass.
- Negative/security cases: duplicate username, invalid role/status, malformed values,
  and repository output leaking a hash are rejected or sanitized.
- Dependencies: current SQLite migration runner and approved normalization/password
  policies.
- Required tests: migration, repository integration, constraints, sanitization.
- Size: Medium.
- Order: 1.

### S13-02 — Secure Admin Bootstrap

**As an** installer, **I want** a controlled command to create the first administrator
**so that** an installation can be initialized without public registration.

- Value: provides a secure operational entry point.
- Acceptance criteria: environment input; active `ADMIN`; bcrypt hash before insert;
  duplicate-safe failure; non-zero invalid-config exit; no public registration route.
- Negative/security cases: missing values, weak password, duplicate username, repeated
  accidental execution, and secret-bearing logs.
- Dependencies: S13-01 and the approved environment/password policies.
- Required tests: command success/failure, duplicate behavior, hashing, captured logs.
- Size: Medium.
- Order: 2.

### S13-03 — Login and Access Token Issuance

**As an** active User, **I want** to log in with username and password **so that** I
receive a short-lived credential for REST access.

- Value: enables trusted REST identity.
- Acceptance criteria: strict body; `200` approved envelope; mandatory expiry;
  30-minute default; tested environment override; minimal claims.
- Negative/security cases: unknown username, wrong password, disabled User, malformed
  body, unknown fields, enumeration, and sensitive response/log data.
- Dependencies: S13-01 and S13-02 and the approved Login/JWT contracts.
- Required tests: schema, service, route, expiry, claims, generic failure.
- Size: Medium.
- Order: 3.

### S13-04 — Authentication Middleware and Active-User Enforcement

**As the** platform owner, **I want** every protected request tied to an active
persisted User **so that** deleted or disabled Users lose access immediately.

- Value: closes the anonymous and stale-token boundary.
- Acceptance criteria: valid Bearer verification; SQLite lookup per request; current
  role/status; sanitized principal; Health/Login remain public.
- Negative/security cases: absent, malformed, tampered, or expired token; missing or
  disabled User; invalid claims; controller invocation after rejection.
- Dependencies: S13-03 and the approved JWT algorithm, issuer, and audience.
- Required tests: middleware unit/integration tests and public-route regression tests.
- Size: Large.
- Order: 4.

### S13-05 — Role-Based API Authorization

**As an** administrator, **I want** API operations restricted by approved role **so
that** Users receive only their intended capabilities.

- Value: protects configuration and operational actions.
- Acceptance criteria: actual-route mapping implements the approved matrix; `401` and
  `403` remain distinct; existing successful business contracts remain unchanged.
- Negative/security cases: VIEWER mutation, OPERATOR configuration mutation, missing
  route mapping, and trusting stale token roles.
- Dependencies: S13-04 and the approved Alarm acknowledgment policy.
- Required tests: positive and negative cases for every route/role mapping.
- Size: Large.
- Order: 5.

### S13-06 — Admin User Management

**As an** ADMIN, **I want** minimum User lifecycle operations **so that** authorized
accounts can be created, assigned roles, secured, and disabled.

- Value: makes the authentication foundation operable after bootstrap.
- Acceptance criteria: approved minimum endpoints; ADMIN-only access; sanitized output;
  hashed password changes; role/status constraints; active-ADMIN lockout prevention.
- Negative/security cases: OPERATOR/VIEWER access, self-role escalation, plaintext
  password update, hash disclosure, duplicate username, and last-ADMIN disablement.
- Dependencies: S13-05 and the approved endpoint and last-ADMIN policies.
- Required tests: route/service/repository integration and complete ADMIN/non-ADMIN
  negative coverage.
- Size: Large.
- Order: 6.

### S13-07 — Security Hardening and Regression Coverage

**As a** maintainer, **I want** security and compatibility regression coverage **so
that** authentication cannot silently leak secrets or break established APIs.

- Value: provides release confidence.
- Acceptance criteria: all protected areas covered; sensitive-data log assertions;
  disable/delete invalidation; existing success contracts preserved; MQTT unchanged.
- Negative/security cases: malformed JSON, internal errors, bypass attempts, invalid
  role/status combinations, and unprotected future-route regression.
- Dependencies: S13-01 through S13-06.
- Required tests: cross-layer acceptance, security regression, MQTT contract regression.
- Size: Medium/Large.
- Order: 7.

### S13-08 — Operational Documentation and Final Validation

**As an** operator and maintainer, **I want** accurate bootstrap, configuration,
security, and release documentation **so that** Sprint 13 can be operated and reviewed
without exposing secrets.

- Value: makes the increment supportable and releasable.
- Acceptance criteria: environment/bootstrap documentation; route/role matrix;
  deferred scope; all gates and CI pass; closure evidence is accurate.
- Negative/security cases: example real secrets, undocumented public routes, planned
  capabilities described as implemented, or premature version changes.
- Dependencies: S13-07 and closure approval.
- Required tests: official quality gates, documentation review, `git diff --check`.
- Size: Medium.
- Order: 8.

## Approved Implementation Decisions

The following nine implementation decisions are approved and fixed for Sprint 13.

### 1. Environment Variables

- `BIOEMS_JWT_SECRET`
- `BIOEMS_JWT_EXPIRE_MINUTES=30`
- `BIOEMS_JWT_ISSUER=bio-ems`
- `BIOEMS_JWT_AUDIENCE=bio-ems-api`
- `BIOEMS_BOOTSTRAP_ADMIN_USERNAME`
- `BIOEMS_BOOTSTRAP_ADMIN_PASSWORD`
- `BIOEMS_BOOTSTRAP_ADMIN_EMAIL`

The JWT secret is supplied only through the environment. No production default is
allowed.

### 2. Password Policy

- Minimum length: 12 characters.
- Maximum length: 72 bytes after UTF-8 encoding, matching bcrypt's safe input limit.
- At least one uppercase letter, one lowercase letter, and one digit.
- bcrypt cost factor: at least 12.
- Password input is not trimmed, normalized, or otherwise modified.
- Plaintext passwords and password hashes are never logged or returned.

### 3. Username Policy

- Apply `trim`, then lowercase before validation, persistence, and Login lookup.
- Length: 3 through 64 characters after normalization.
- Allowed characters: `a-z`, `0-9`, `.`, `_`, and `-`.
- The normalized value has a unique constraint.
- Username is immutable after creation.

### 4. JWT Signing Algorithm

- `HS256` is fixed in application signing and verification.
- The `none` algorithm and dynamic algorithm selection are forbidden.
- `RS256` is deferred until a central server or multi-service architecture requires it.

### 5. Token Validation

Every access token requires successful validation of:

- Signature.
- `iss`, fixed to `bio-ems`.
- `aud`, fixed to `bio-ems-api`.
- `exp`.
- `sub`.

The User's current role and status are read from SQLite for every authenticated
request; token claims are not authoritative for current authorization state.

### 6. Last Active ADMIN Protection

- The last active `ADMIN` cannot be disabled or demoted.
- An `ADMIN` cannot disable themselves or change their own role.
- Users are never physically deleted.
- Last-active-ADMIN checks and the protected mutation execute within one transaction.

### 7. ADMIN User Management Endpoints

The approved proposed routes are:

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{user_id}`
- `PATCH /api/v1/users/{user_id}/status`
- `PUT /api/v1/users/{user_id}/password`

All are `ADMIN`-only. The surface excludes deletion, forgotten password, email
verification, self-service password change, Refresh Tokens, and bulk operations.

### 8. Alarm Acknowledgment Authorization

- `ADMIN` and `OPERATOR` may acknowledge Alarms.
- `VIEWER` may not acknowledge Alarms.
- The acknowledging User ID is recorded with the acknowledgment.
- A complete persistent Audit Log remains deferred.

### 9. Login Contract

The approved public route is `POST /api/v1/auth/login`. Its success response is:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

There is no Refresh Token or password hash. Login failures use one generic response.
Disabling a User or changing their role takes effect on the next request because the
User is re-read from SQLite.

## Security Requirements

- `bcrypt` is the only approved password hashing implementation.
- Plaintext passwords must never be persisted.
- APIs must never return `password_hash`.
- JWT secret material comes from environment configuration only.
- Missing or invalid JWT secret must fail safely according to the current configuration
  startup pattern; it must never fall back to a production default.
- Every access token has mandatory expiry.
- Login failure is generic for unknown username, incorrect password, and disabled User.
- Login, username, email, password, role, and status inputs use strict validation and
  the approved length and normalization policies.
- Self-role escalation is forbidden.
- Bootstrap must resist unintended repeated execution and must not overwrite Users.
- The approved transactional S13-06 policy prevents disabling or demoting the last
  active `ADMIN`, and Users are not physically deleted.
- Passwords, hashes, JWTs, and secrets must not appear in logs.
- Every request uses the current role and status loaded from SQLite.
- Authorization must not rely on role/status claims alone.
- Authentication or authorization rejection must stop before business handlers.
- MQTT authentication and telemetry processing remain outside the User JWT boundary.

## Implementation Phases

### Phase 1 — User Domain and Migration

- Goal: freeze route/contracts, define User types, and add the ordered migration.
- Expected areas: route characterization tests, User entity/types, SQLite migration and
  runner tests.
- Tests: current response characterization, fresh/upgrade/idempotency, constraints.
- Dependencies: approved username and password policies.
- Review gate: verify the User schema and migration conform to the approved policies.
- Proposed commit: `feat: add user domain and persistence`

### Phase 2 — Password Security and Bootstrap

- Goal: add bcrypt-only password handling and the environment-driven ADMIN command.
- Expected areas: password service, bootstrap script/command, repository integration.
- Tests: hash/verify, missing environment, duplicate/repeat execution, safe logs.
- Dependencies: Phase 1 and approved environment/password policies.
- Review gate: verify password service and bootstrap conformance to the approved values.
- Proposed commit: `feat: add secure admin bootstrap`

### Phase 3 — Login and JWT

- Goal: add strict Login validation and short-lived access-token issuance.
- Expected areas: auth DTO/schema, service, controller, route, config.
- Tests: success envelope, generic failure, expiry, algorithm, claims, length limits.
- Dependencies: Phases 1–2 and approved JWT and Login contracts.
- Review gate: verify Login/JWT conformance to the approved contract.
- Proposed commit: `feat: add user login and access tokens`

### Phase 4 — Authentication Middleware

- Goal: protect all non-public REST routes and enforce active persisted Users.
- Expected areas: middleware, Express request typing, app/router composition.
- Tests: token failures, DB lookup, disable/delete invalidation, public allowlist.
- Dependencies: Phase 3.
- Review gate: middleware and public-route boundary approval.
- Proposed commit: `feat: enforce authenticated API access`

### Phase 5 — Authorization Policy Integration

- Goal: map every actual route to the approved capabilities and roles.
- Expected areas: authorization policy/middleware and existing route composition.
- Tests: every route/role positive and negative mapping; `401` versus `403`.
- Dependencies: Phase 4 and approved Alarm acknowledgment mapping.
- Review gate: verify the complete actual-route mapping matches the approved matrix.
- Proposed commit: `feat: enforce role based API authorization`

### Phase 6 — Admin User Management

- Goal: add the approved minimum ADMIN-only User operations.
- Expected areas: proposed User DTOs, routes, controller, service, repository operations.
- Tests: ADMIN success; non-ADMIN rejection; sanitization; hash protection;
  self-escalation and last-ADMIN lockout prevention.
- Dependencies: Phase 5 and approved endpoint/last-ADMIN policies.
- Review gate: verify endpoint contracts and transaction design before implementation.
- Proposed commit: `feat: add admin user management`

### Phase 7 — Security and Regression Tests

- Goal: prove security boundaries and preserve existing business/MQTT contracts.
- Expected areas: middleware, route, integration, acceptance, and log-capture tests.
- Tests: bypass attempts, malformed inputs, secret leakage, contract regressions,
  disabled/deleted Users, MQTT invariance.
- Dependencies: Phases 1–6.
- Review gate: security regression coverage approval.
- Proposed commit: `test: complete Sprint 13 security coverage`

### Phase 8 — Documentation and Sprint Validation

- Goal: document the implemented surface and execute final local/CI validation.
- Expected areas: operational auth/bootstrap docs, project state, roadmap, Sprint
  closure, and release metadata only after closure approval.
- Tests: all official gates, CI, documentation consistency, `git diff --check`.
- Dependencies: Phase 7 and closure authorization.
- Review gate: final Sprint closure review before version/release work.
- Proposed commit: `docs: close Sprint 13 authentication foundation`

## Proposed Commit Plan

No commit is created by this planning document. The proposed implementation order is:

1. `docs: approve Sprint 13 authentication plan`
2. `feat: add user domain and persistence`
3. `feat: add secure admin bootstrap`
4. `feat: add user login and access tokens`
5. `feat: enforce authenticated API access`
6. `feat: enforce role based API authorization`
7. `feat: add admin user management`
8. `test: complete Sprint 13 security coverage`
9. `docs: close Sprint 13 authentication foundation`

Commits must remain dependency-ordered and independently reviewable. Version and
CHANGELOG changes belong only to the final approved closure commit.

## Review Gates

Implementation must pause for focused review:

1. After the User schema and migration.
2. After the password service and bootstrap command.
3. After Login and JWT issuance.
4. After authentication middleware and active-User enforcement.
5. After preparing the complete actual-route mapping, verify it against the approved
   matrix before wiring RBAC.
6. Before ADMIN User-management implementation, verify endpoint contracts and the
   transactional lockout design against the approved policies.
7. After security and compatibility regression coverage.
8. Before Sprint closure, version metadata, or CHANGELOG updates.

## Test and Quality Plan

Required coverage includes:

- Fresh and existing database migration paths and idempotency.
- User uniqueness, normalization, role/status constraints, and sanitization.
- bcrypt hashing and verification with no plaintext persistence path.
- Bootstrap success, invalid configuration, duplicate/repeated execution, and safe logs.
- Login validation, generic failure, expiry, claims, and success contract.
- Missing, malformed, expired, and tampered access tokens.
- Missing, disabled, and deleted token Users.
- Database role/status lookup on every authenticated request.
- Sanitized Express principal.
- Complete actual-route authorization matrix.
- ADMIN User-management security and last-ADMIN protection.
- Correct `401`, `403`, `404`, and `409` behavior.
- Health and Login public access and anonymous rejection everywhere else.
- Preservation of existing successful REST response contracts.
- No passwords, hashes, tokens, or secrets in responses or captured logs.
- No MQTT topic, payload, subscription, authentication, or telemetry-policy change.

Official gates:

```text
npm ci
npm run typecheck
npm run build
npm run lint
npm run format:check
npm run test:run
git diff --check
```

GitHub Actions must pass `CI / Backend quality gates` on the Sprint Pull Request.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Authentication expands into a complete IAM product | Keep access-token-only, three roles, and the minimum ADMIN surface |
| Existing APIs break under default protection | Characterize contracts and build authenticated test helpers first |
| Disabled Users retain access | Resolve persisted User role and status on every request |
| Tokens accept unintended algorithms or claims | Explicit algorithm allowlist and strict claim validation |
| Login permits User enumeration | Generic failure for unknown, incorrect, and inactive identities |
| Secrets enter logs or responses | Centralized sanitization plus log/response assertions |
| Bootstrap overwrites or exposes an account | Duplicate-safe create-only behavior and no secret output |
| All ADMIN accounts are disabled | Atomic last-active-ADMIN protection approved before S13-06 |
| RBAC is inconsistent across routers | Complete actual-route mapping and per-route tests |
| MQTT is coupled to User JWT | Keep middleware exclusively on the Express REST boundary |
| Multi-tenancy expands persistence | Preserve explicit single-tenant scope |

## Dependencies

- Existing SQLite migration infrastructure.
- Existing `bcrypt`, `jsonwebtoken`, Zod, Express, and TypeScript dependencies.
- Existing validation, async-handler, AppError, and error middleware patterns.
- Existing CI workflow.
- Conformance to the approved implementation decisions at each Review Gate.

No new dependency is approved. A demonstrated need requires separate review before any
installation or lockfile change.

## Definition of Done

Sprint 13 is complete only when:

- All eight User Stories are completed and accepted.
- The User migration is ordered, idempotent, and tested.
- Passwords are stored only as bcrypt hashes.
- The first ADMIN is created only through the approved bootstrap command.
- No public registration endpoint exists.
- Login uses username and issues a mandatory-expiry access token.
- The default expiry is 30 minutes and environment override is tested.
- The minimum ADMIN User-management scope is implemented and tested.
- Self-role escalation and last-active-ADMIN lockout are prevented by the approved
  policy.
- The Authorization Matrix is mapped to actual routes, implemented, and tested.
- All targeted REST APIs require authentication; only Health and Login are public.
- `401` and `403` are applied correctly and do not expose internals.
- Disabled or deleted Users cannot use previously issued tokens.
- APIs and logs expose no passwords, hashes, tokens, or secrets.
- Existing successful REST contracts remain compatible after authorization.
- MQTT Device authentication, topics, and telemetry behavior are unchanged.
- Refresh tokens, Frontend, multi-tenancy, persistent audit logging, and other excluded
  capabilities remain outside the implementation.
- VERSION and CHANGELOG are changed only during approved Sprint closure.
- Repository, service, middleware, route, integration, security, and acceptance tests
  pass.
- Typecheck, build, lint, format check, tests, and `git diff --check` pass.
- GitHub Actions passes.
- No capability outside the approved scope is introduced.

## Delivery Structure

- Branch: `sprint-13-auth-foundation`
- One focused Sprint Pull Request with independently reviewable commits.
- Target release: `v0.13.0` only after review, merge, post-merge verification, and
  explicit release authorization.
- No tag, release, or deployment during implementation.

## Deferred Beyond Sprint 13

- Refresh-token and session-revocation architecture.
- Password recovery, invitations, and email verification.
- MFA and external identity providers.
- Tenant isolation and customer administration.
- Persistent audit events and historical security reporting.
- Device authentication, certificates, and secure MQTT identity.
- Frontend authentication shell and Asset-first user journey.
- Notifications, reporting, deployment packaging, and OTA.
- Telemetry resilience and generic query completion.
- Monitoring Points and Asset domain implementation.
- Alarm resolution or new Alarm lifecycle capabilities.
- Existing npm audit remediation.
