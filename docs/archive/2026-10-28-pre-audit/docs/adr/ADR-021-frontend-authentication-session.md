# ADR-021: Frontend Authentication Session and Authorization-Aware Routing

## Status

Accepted

The Product Owner and architecture decisions represented by this ADR are approved.
Acceptance records the governing design for S14-03; it does not itself authorize or
claim implementation.

## Date

2026-08-12

## Decision Owners

| Responsibility | Owner |
| --- | --- |
| Product behavior and scope | Product Owner |
| Authentication and authorization architecture | Engineering and Architecture Review |
| Backend contract conformance | Backend Engineering |
| Frontend session and routing conformance | Frontend Engineering |
| Security, accessibility, and test evidence | Engineering Review |

Implementation may begin only after a separate implementation authorization is issued.

## Business Requirement

BIO-EMS requires a browser authentication experience that allows an existing active
Backend user to sign in, retain an authenticated session across reloads within one
browser tab, restore the current persisted user principal, and access application routes
according to the centralized Backend role and permission model.

The solution must:

- build on the authentication and RBAC capabilities delivered in Sprint 13;
- preserve the application shell, accessibility, responsive, localization, focus, and
  layering contracts established by S14-01 and S14-02;
- keep the Backend authoritative for authentication and authorization;
- avoid expanding the security model into refresh tokens, server sessions, token
  revocation, or other later-story capabilities;
- fail closed when authentication state cannot be safely validated or persisted;
- prevent protected-content disclosure while authentication is unresolved; and
- provide predictable, accessible recovery from temporary authentication-restoration
  failures.

## Primary Use Cases

### UC-1: Sign in with valid credentials

1. An unauthenticated user opens the application.
2. The application renders the Login route.
3. The user supplies a username and password.
4. The frontend sends `POST /api/v1/auth/login` without an Authorization header.
5. The frontend validates the response at the API boundary.
6. The frontend calculates local expiry using the validated `expires_in` value.
7. The frontend writes the complete session record through the approved
   `sessionStorage` adapter.
8. Only after persistence succeeds does the application become authenticated.
9. The user is directed to a safe, permitted requested route or `/`.

### UC-2: Reject invalid credentials safely

1. Login returns `401 INVALID_CREDENTIALS`.
2. The Login page displays a generic localized invalid-credentials message.
3. The response does not identify whether the username or password was incorrect.
4. No authenticated session is created.
5. Global protected-session invalidation is not invoked for a Login `401`.

### UC-3: Restore an unexpired session

1. The application reads the versioned session record through the storage adapter.
2. The adapter strictly validates the record.
3. If the record is invalid or expired, it is removed and the application becomes
   unauthenticated.
4. If it is valid and unexpired, the frontend calls `GET /api/v1/auth/me`.
5. The Backend validates the token and resolves the current persisted active User.
6. The frontend replaces the stored user snapshot with the principal returned by
   `/auth/me`.
7. Protected content and the authenticated shell render only after restoration succeeds.

### UC-4: Recover from temporary restoration failure

If `/auth/me` fails because of a network error, `5xx`, malformed success response, or an
unexpected `403`:

- protected content and the authenticated shell remain hidden;
- an otherwise valid and unexpired session record is retained;
- the state becomes `restoration-error`;
- Retry and Logout actions are presented;
- local expiry continues to be enforced;
- Retry invokes `/auth/me` again; and
- Logout or expiry clears the session and authenticated cache state.

### UC-5: Enforce authorization-aware routes

1. An authenticated user navigates to an application route.
2. The frontend evaluates centralized route-permission metadata against the restored role.
3. A permitted route renders normally.
4. A known but disallowed route renders Not Authorized.
5. An unknown route renders Not Found.
6. The Backend independently enforces authorization for every protected operation.

### UC-6: Preserve the legacy foundation redirect

1. `/foundation` remains a known internal legacy route.
2. It is not shown in navigation.
3. Unauthenticated access passes through authentication protection.
4. After successful authentication, it resolves to `/`.
5. It must not become Not Found or Not Authorized.

### UC-7: Handle a protected-request `401`

When a protected request returns `401`:

1. protected rendering and further protected request dispatch are blocked;
2. active authenticated queries are cancelled where supported;
3. the session is cleared;
4. TanStack Query query and mutation state is cleared; and
5. the application becomes unauthenticated.

### UC-8: Handle a normal protected-operation `403`

When a protected operation other than `/auth/me` returns `403`:

- the authenticated session is preserved;
- the token is not cleared;
- global QueryClient state is not cleared; and
- the UI renders route-level Not Authorized or operation-level denial as appropriate.

### UC-9: Log out locally

1. The user activates Logout.
2. New protected operations are blocked.
3. Active authenticated queries are cancelled where supported.
4. TanStack Query state is cleared.
5. The `sessionStorage` record and in-memory authentication state are cleared.
6. The application navigates to Login using replacement navigation.
7. Browser Back cannot reveal protected content.
8. No server logout request is made.

## Authentication and Authorization Domain Review

### Authentication

Authentication answers: **Who is the user?**

The existing Backend Login endpoint authenticates credentials and returns a signed access
token plus a sanitized user snapshot.

For every protected request, the existing authentication middleware:

- verifies the Bearer access token;
- validates its cryptographic and registered claims;
- reads the current User from persistence using the token subject;
- requires the User to remain active; and
- sets a sanitized persisted principal on `req.user`.

The token identifies the subject. It is not the authority for the user's current role.

### Authorization

Authorization answers: **What may the user do?**

The Backend role and permission model remains authoritative. The current roles are:

- `ADMIN`
- `OPERATOR`
- `VIEWER`

The complete permission vocabulary is exactly:

- `CONFIGURATION_READ`
- `CONFIGURATION_WRITE`
- `DEVICE_READ`
- `DEVICE_MANAGE`
- `ALARM_READ`
- `ALARM_ACKNOWLEDGE`
- `DASHBOARD_READ`
- `USER_MANAGE`

The frontend must not introduce aliases such as `CONFIG_READ`, shortened names, new
roles, or new permissions.

Frontend route and navigation checks improve presentation and usability. They are not a
security boundary and never replace Backend authorization.

### Data-scope isolation

S14-03 does not introduce a tenant, site, Asset, or Monitoring Point authorization model.

Authentication, authorization, and resource-scope isolation remain distinct:

- authentication establishes the current principal;
- authorization determines permitted actions; and
- resource-scope isolation determines which domain records may be accessed.

S14-03 implements only the approved frontend session and presentation of existing
Backend role permissions.

## Decision

### 1. Current-user endpoint

Add the protected endpoint:

`GET /api/v1/auth/me`

It must reuse `req.user`, populated from the current persisted active User by the
existing authentication middleware.

It must not:

- derive identity or role from untrusted frontend data;
- use JWT role claims as authority;
- expose the token or claims;
- expose a password hash;
- expose email;
- expose status internals; or
- duplicate authentication or User-loading logic in the controller.

No role permission beyond successful authentication is required.

Consequently, a `403` from `/auth/me` is unexpected. It represents a contract,
authorization-configuration, proxy, or infrastructure condition and is not a normal
route-authorization denial.

### 2. Browser session storage

Use `sessionStorage` exclusively through a strict, versioned, testable adapter.

Do not use:

- `localStorage`;
- cookies;
- IndexedDB;
- an implicit in-memory persistence fallback;
- refresh tokens;
- server-side sessions;
- token revocation;
- JWT role decoding; or
- a server logout endpoint.

Validated session data may be held in React memory while the application runs, but this
is not an alternative persistence mechanism.

### 3. Backend authority

The principal returned by `/auth/me` replaces the user snapshot returned by Login.

There is no continuous role polling in S14-03. Between restoration and later requests,
the Backend remains authoritative and may deny an operation even when the frontend's last
restored role appeared to permit it.

### 4. Authenticated landing route

`/` remains the temporary authenticated workspace landing route.

It requires `DASHBOARD_READ`, currently held by `ADMIN`, `OPERATOR`, and `VIEWER`.

S14-03 does not implement Dashboard data contracts or operational widgets.

### 5. ADMIN Users placeholder

Add `/users` as a presentation-only placeholder protected by `USER_MANAGE`.

Under the current role-permission model, it is visible and accessible only to `ADMIN`.

The placeholder must not:

- call User Management APIs;
- list users;
- create users;
- edit users;
- change user status, role, or password; or
- duplicate Backend User Management operations.

## Exact API Contracts

### Login request

`POST /api/v1/auth/login`

Headers:

```http
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "username": "string",
  "password": "string"
}
```

The frontend must send Login without an Authorization header.

It must not log, persist, cache, render, or include the password in diagnostics.

### Login success

Status: `200 OK`

```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "string",
    "role": "ADMIN"
  }
}
```

`1800` is the current configured illustrative example/default. It is not a frontend
constant.

Contract rules:

- `access_token` is a non-empty opaque string.
- `token_type` is exactly `"bearer"`.
- `expires_in` is a positive finite integer in seconds.
- `user.id` is a positive integer.
- `user.username` is a non-empty string.
- `user.role` is exactly `ADMIN`, `OPERATOR`, or `VIEWER`.
- The frontend always calculates expiry from the validated response value.
- The frontend must not hard-code `1800` or any other token lifetime.
- The frontend must not decode the access token to obtain role or expiry authority.

### Login validation failure

Status: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "string"
  }
}
```

### Invalid credentials

Status: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "string"
  }
}
```

The UI displays a generic localized invalid-credentials message.

### Current persisted principal request

`GET /api/v1/auth/me`

Headers:

```http
Accept: application/json
Authorization: Bearer <access-token>
```

### Current persisted principal success

Status: `200 OK`

The body is exactly:

```json
{
  "user": {
    "id": 1,
    "username": "string",
    "role": "ADMIN"
  }
}
```

The only permitted response fields are:

- `user.id`
- `user.username`
- `user.role`

No token, claims, password hash, email, status internals, or other User fields may be
returned.

### Authentication failure

Missing, malformed, invalid, expired, inactive, or deleted principals return:

Status: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "string"
  }
}
```

The endpoint relies on the existing authentication middleware for this behavior.

## Login Experience Contract

### Fields and submission

The Login form must provide:

- a username field;
- a password field with `type="password"`;
- username `autocomplete="username"`;
- password `autocomplete="current-password"`;
- keyboard submission through a semantic form;
- a visible submit action;
- a disabled submission state while a request is in progress; and
- a localized progress indication.

The password value must never be rendered elsewhere in the page or included in logs.

### Error handling

The Login experience must provide safe, localized messages for:

- invalid credentials;
- client-side validation failures;
- network failures;
- malformed API responses; and
- Backend server failures.

Messages must not:

- reveal whether the username exists;
- expose raw exception contents;
- expose response internals;
- expose the password or token; or
- expose an Authorization header or raw session record.

### Accessibility

The form must provide:

- visible localized labels;
- programmatic label-control association;
- programmatic error association;
- an accessible error announcement;
- predictable focus on the first invalid field or error summary;
- keyboard-operable submission;
- a detectable disabled/progress state; and
- appropriate focus after successful Login.

### Safe requested-route return

When an unauthenticated user requests a protected route:

- the requested internal route may be retained only in React Router location state;
- it must not be stored in `sessionStorage`, `localStorage`, query parameters, or another
  persistent location;
- it must match a known internal route in the centralized route registry;
- it must be permitted for the restored role before navigation occurs; and
- successful Login returns to that safe permitted route or `/`.

The return target validator must reject:

- absolute external URLs;
- protocol-relative URLs;
- values containing an external scheme or origin;
- `/login`;
- unknown application paths;
- malformed paths; and
- routes not permitted for the restored role.

Authenticated access to `/login` redirects to `/`.

Logout uses replacement navigation and clears session state before navigation. Browser
Back after Logout may revisit a protected URL, but guards must render Login rather than
cached or protected content.

## Authentication State Machine

The frontend authentication state is a discriminated union. It must not infer
authentication from the presence of an arbitrary token string.

| State | Protected shell/content | Permitted transitions |
| --- | --- | --- |
| `initializing` | Hidden | `restoring`, `unauthenticated` |
| `unauthenticated` | Hidden | `authenticating` |
| `authenticating` | Hidden | `authenticated`, `unauthenticated` |
| `restoring` | Hidden | `authenticated`, `restoration-error`, `unauthenticated` |
| `authenticated` | Permission-controlled | `unauthenticated`, `restoring` |
| `restoration-error` | Hidden | `restoring`, `unauthenticated` |

### Startup transitions

```text
Application startup
  |
  +-- no stored record ------------------------------> unauthenticated
  |
  +-- invalid or unsupported record
  |       |
  |       +-- remove record --------------------------> unauthenticated
  |
  +-- valid but expired record
  |       |
  |       +-- clear record and auth cache -----------> unauthenticated
  |
  +-- valid and unexpired record --------------------> restoring
          |
          +-- /auth/me 200 and valid body -----------> authenticated
          |
          +-- /auth/me 401 --------------------------> clear -> unauthenticated
          |
          +-- network, 5xx, malformed body ----------> restoration-error
          |
          +-- unexpected /auth/me 403 ---------------> restoration-error
```

An unexpected `/auth/me` `403` must never:

- render the authenticated shell;
- render protected content;
- mark restoration successful; or
- show the normal route-level Not Authorized page.

### Login transitions

```text
unauthenticated
  |
  +-- submit ----------------------------------------> authenticating
          |
          +-- valid 200 + successful persistence ----> authenticated
          |
          +-- valid 200 + storage failure -----------> fail closed -> unauthenticated
          |
          +-- 400/401 --------------------------------> unauthenticated with safe error
          |
          +-- network/5xx/malformed response --------> unauthenticated with safe error
```

Authenticated state must not be published before the validated Login result is
successfully persisted.

## `sessionStorage` Contract

### Storage key

Use one centralized namespaced constant, for example:

`bio-ems.auth.session`

The concrete key must not be duplicated as a magic string.

### Version 1 schema

```ts
interface StoredAuthenticationSessionV1 {
  version: 1;
  accessToken: string;
  tokenType: "bearer";
  expiresAt: number;
  user: {
    id: number;
    username: string;
    role: "ADMIN" | "OPERATOR" | "VIEWER";
  };
}
```

`expiresAt` is an absolute Unix epoch value in milliseconds calculated using one captured
response time:

```text
expiresAt = responseReceivedAt + validatedExpiresIn * 1000
```

`validatedExpiresIn` comes from the Login response. It is not a hard-coded frontend
lifetime.

### Strict validation rules

The adapter must:

- accept only a plain object matching the supported schema;
- reject malformed JSON;
- reject unsupported versions;
- reject missing or unexpected fields;
- reject an empty access token;
- require `tokenType` to be exactly `"bearer"`;
- require `expiresAt` to be a finite safe integer representing a future instant;
- require `user.id` to be a positive integer;
- require a non-empty `user.username`;
- require one of the three exact roles;
- remove invalid or expired records;
- return typed data rather than unvalidated casts;
- never decode JWT payload fields;
- never log the token or full record; and
- expose testable `read`, `write`, and `clear` operations.

Storage read, write, serialization, quota, access, and security failures fail closed.

A valid Login response that cannot be persisted is discarded. The application remains
unauthenticated with no memory or `localStorage` persistence fallback.

If a refreshed `/auth/me` principal cannot be safely persisted, the session also fails
closed rather than continuing with stale persisted identity.

## Expiry, Focus, and Visibility

Expiry is enforced:

- when the stored record is read;
- before protected content renders;
- before protected requests are dispatched;
- through a timer scheduled for the current expiry;
- when the browser window regains focus; and
- when the document becomes visible.

When current time is greater than or equal to `expiresAt`, the application must:

1. block protected rendering and operations;
2. cancel active authenticated queries where supported;
3. clear TanStack Query state;
4. clear stored and in-memory session state; and
5. become unauthenticated.

Timers are recalculated when the session changes and removed when providers unmount.

Focus and visibility events enforce local expiry only. They do not introduce continuous
role polling.

`/auth/me` is invoked:

- during startup or reload restoration; and
- when the user explicitly retries a restoration error.

## Restoration-Error Policy

The following `/auth/me` outcomes enter `restoration-error` while the record remains
valid and unexpired:

- network failure;
- `5xx`;
- malformed success response; and
- unexpected `403`.

In `restoration-error`:

- retain only the otherwise valid and unexpired stored record;
- keep all protected content hidden;
- do not render the authenticated shell;
- do not expose authenticated cached data;
- provide localized Retry and Logout actions;
- continue enforcing local expiry;
- clear the session if it expires; and
- never treat restoration as successful.

Retry re-enters `restoring` and invokes `/auth/me`.

Logout clears session and cache state even if the Backend is unavailable.

An unexpected `/auth/me` `403` is not rendered as normal route-level Not Authorized
because `/auth/me` requires authentication only and has no role permission.

## `401` and `403` Policy

### Login `401`

A Login `401`:

- displays generic invalid credentials;
- creates no session;
- does not invoke global session invalidation; and
- does not clear unrelated public query state.

### Protected-request `401`

A `401` from a protected request:

- blocks protected presentation;
- aborts or cancels active authenticated requests where supported;
- clears stored and in-memory session state;
- clears TanStack Query query and mutation state; and
- returns to Login.

Concurrent `401` responses are handled idempotently.

### General protected-operation `403`

A `403` from a normal protected route or domain operation:

- preserves the authenticated session;
- preserves the token;
- does not globally clear QueryClient state;
- shows route-level Not Authorized for a denied route; or
- shows operation-level denial for an action within a permitted route.

It must not be converted into Logout.

### Unexpected `/auth/me` `403`

A `403` from `/auth/me` during restoration:

- preserves only an otherwise valid and unexpired stored record;
- enters `restoration-error`;
- keeps protected content and the authenticated shell hidden;
- provides Retry and Logout;
- continues local expiry; and
- never displays normal route-level Not Authorized.

## Route and Permission Policy

Route metadata must be centralized and typed. Page components must not contain scattered
role checks.

| Route | Authentication | Required permission | Current role access | S14-03 behavior |
| --- | --- | --- | --- | --- |
| `/login` | Public only | None | Unauthenticated | Login; authenticated access redirects to `/` |
| `/` | Required | `DASHBOARD_READ` | ADMIN, OPERATOR, VIEWER | Temporary authenticated workspace |
| `/dashboard` | Required | `DASHBOARD_READ` | ADMIN, OPERATOR, VIEWER | Existing placeholder; no Dashboard API |
| `/monitored-areas` | Required | `CONFIGURATION_READ` | ADMIN, OPERATOR, VIEWER | Existing display route; no new domain contract |
| `/alarms` | Required | `ALARM_READ` | ADMIN, OPERATOR, VIEWER | Existing placeholder |
| `/devices` | Required | `DEVICE_READ` | ADMIN, OPERATOR, VIEWER | Existing placeholder |
| `/configuration` | Required | `CONFIGURATION_READ` | ADMIN, OPERATOR, VIEWER | Existing placeholder |
| `/users` | Required | `USER_MANAGE` | ADMIN only | Non-operational Users placeholder |
| `/foundation` | Required legacy redirect | Resolves through `/` and `DASHBOARD_READ` | ADMIN, OPERATOR, VIEWER | Known internal redirect to `/`; hidden from navigation |
| Unknown route | Context-dependent | None | Any | Not Found |

Policy rules:

- authentication guards determine whether a session is restored;
- permission guards determine whether a known protected route may render;
- navigation uses the same centralized route-permission metadata;
- direct navigation to a known disallowed route renders Not Authorized;
- unknown paths render Not Found;
- `/foundation` remains an authenticated redirect and must not become Not Found or Not
  Authorized;
- hiding navigation is usability behavior, not security enforcement;
- Backend authorization remains mandatory;
- redirect targets must be safe known internal paths; and
- the authenticated shell must not render before successful restoration.

## Frontend Role and Permission Contract

The frontend may mirror the established Backend role-permission mapping in one typed,
tested module for presentation decisions.

Its permission type must use exactly:

```ts
type Permission =
  | "CONFIGURATION_READ"
  | "CONFIGURATION_WRITE"
  | "DEVICE_READ"
  | "DEVICE_MANAGE"
  | "ALARM_READ"
  | "ALARM_ACKNOWLEDGE"
  | "DASHBOARD_READ"
  | "USER_MANAGE";
```

There is no `CONFIG_READ` alias.

The frontend must not:

- define new roles or permissions;
- shorten permission literals;
- infer roles from JWT claims;
- treat its checks as authoritative; or
- bypass Backend denial.

The `/auth/me` principal is the current frontend role snapshot. Backend authorization
encountered after restoration remains authoritative.

## API Client Security Boundary

The API client must provide explicit public and protected request modes.

Requirements:

- caller-supplied `Authorization` is rejected in both public and protected modes;
- Login is sent without Authorization;
- protected mode injects exactly one adapter-controlled
  `Authorization: Bearer <token>` header;
- arbitrary caller Authorization values are never preserved or silently overridden;
- existing `HeadersInit` support for objects, `Headers`, and tuple arrays is preserved;
- caller headers and custom `Accept` values remain supported;
- authentication JSON is strictly validated at the external boundary;
- response bodies are not trusted through TypeScript casts;
- tokens, passwords, Authorization headers, and raw session records are not logged;
- Login `401` is distinguished from protected-request `401`;
- normal `403` is distinct from `401`;
- unexpected `/auth/me` `403` follows restoration-error policy;
- request cancellation uses fetch/TanStack Query facilities where supported;
- the low-level client does not navigate; and
- session transitions and navigation remain provider/router responsibilities.

## TanStack Query Policy

Authenticated query data must not survive Logout, expiry, or protected-request `401`.

The session controller coordinates:

1. blocking new protected operations;
2. cancelling active authenticated queries through abort signals where supported;
3. clearing storage and in-memory session state;
4. clearing QueryClient query and mutation caches; and
5. transitioning to unauthenticated routing.

The process is idempotent under concurrent failures.

A normal protected-operation `403` does not trigger global cancellation or cache
clearing.

Authentication restoration completes before protected queries become enabled.
Protected requests are disabled during `initializing`, `restoring`, and
`restoration-error`.

## AppShell Identity Contract

After successful authentication or restoration, the AppShell header must display:

- the sanitized username returned by the Backend; and
- the current restored role.

It must also provide an accessible localized Logout action.

The AppShell must never render:

- the access token;
- the password;
- an Authorization header;
- token claims; or
- the raw stored session record.

Navigation visibility is filtered through centralized permission metadata:

- `/users` is visible only to `ADMIN`;
- no page duplicates role checks independently;
- hidden navigation never replaces route or Backend authorization; and
- `/foundation` is not displayed in navigation.

The authenticated shell must preserve:

- permanent desktop Drawer behavior;
- temporary mobile Drawer overlay behavior;
- Escape dismissal;
- backdrop dismissal;
- navigation dismissal;
- focus restoration;
- the skip link;
- reduced-motion behavior;
- English/LTR runtime behavior;
- RTL-ready direction contracts;
- the 320px-safe CSS layout contract; and
- the approved AppBar/Drawer layering relationships.

## Logout Policy

Logout is local in S14-03.

Logout must:

- remain available in authenticated and restoration-error states;
- clear session and authenticated QueryClient state;
- use replacement navigation to Login;
- return focus predictably to the Login experience;
- complete without Backend availability; and
- ensure browser Back cannot reveal protected content.

No token revocation guarantee is claimed.

## Accessibility and Responsive Requirements

S14-03 must preserve the S14-01 and S14-02 contracts, including:

- keyboard-accessible controls and actions;
- visible localized labels and accessible names;
- programmatic association of errors with form fields;
- accessible announcements for Login and restoration failures;
- logical focus after validation failure, Login success, Logout, denial, and restoration
  failure;
- semantic landmarks and heading hierarchy;
- the existing skip link;
- responsive behavior down to the established 320px CSS contract;
- no new horizontal overflow;
- desktop and mobile Drawer behavior;
- focus restoration after temporary Drawer closure;
- reduced-motion support;
- current English/LTR operation;
- typed `en`/`ar` and `ltr`/`rtl` architectural contracts;
- document and MUI theme direction integration;
- no Arabic translations or complete RTL styling; and
- no layering regressions.

Authentication and authorization status must not be communicated through color alone.

## Functional Requirements

1. Provide an accessible Login route using the existing Login API.
2. Use username and password fields with the approved types and autocomplete attributes.
3. Support keyboard submission and disabled/progress behavior.
4. Validate Login responses at the API boundary.
5. Persist only the approved versioned `sessionStorage` record.
6. Fail closed when persistence is unavailable.
7. Restore an unexpired session through `/auth/me`.
8. Render no protected shell or content until restoration succeeds.
9. Replace the Login user snapshot with the persisted principal from `/auth/me`.
10. Enforce expiry at startup, before requests/rendering, through a timer, on focus, and
    on visibility.
11. Treat `/auth/me` network, `5xx`, malformed response, and unexpected `403` as
    restoration errors.
12. Clear session and QueryClient state after protected-request `401`.
13. Keep Login `401` local to the Login experience.
14. Preserve session after a normal protected-operation `403`.
15. Provide local Logout.
16. Preserve safe requested routes only in React Router state.
17. Reject unsafe or unpermitted return targets.
18. Redirect authenticated `/login` access to `/`.
19. Ensure browser Back after Logout cannot reveal protected content.
20. Protect `/` with `DASHBOARD_READ`.
21. Protect `/monitored-areas` and `/configuration` with `CONFIGURATION_READ`.
22. Add `/users` as a `USER_MANAGE` ADMIN-only placeholder.
23. Preserve `/foundation → /` through authentication protection.
24. Filter navigation through centralized permission metadata.
25. Display sanitized username and role in the authenticated header.
26. Preserve the existing shell and localization abstractions.
27. Add `/auth/me` without duplicating middleware or repository behavior.
28. Add automated Backend and Frontend coverage.
29. Add safe manual REST examples to `backend/testing/auth.http`.

## Non-Functional and Security Requirements

- No new dependency.
- No password, token, Authorization header, or raw session record in logs or rendered UI.
- No token in URLs, query strings, fragments, analytics, or error messages.
- Strict fail-closed external response and storage validation.
- No storage fallback.
- No protected-shell flash.
- No open redirect.
- Idempotent concurrent expiry, Logout, and `401` handling.
- Backend authentication and authorization remain authoritative.
- Controllers contain no business logic.
- `/auth/me` reuses the middleware principal.
- No migration is required.
- Existing APIs remain backward compatible.
- Existing Login clients remain supported.
- Existing accessibility, responsive, localization, focus, and layering behavior remains
  intact.
- All project quality gates must pass.

## Required Test Strategy

### Backend automated tests

Vitest/Supertest coverage is mandatory for:

- `/auth/me` success for `ADMIN`, `OPERATOR`, and `VIEWER`;
- exact success response shape;
- absence of token, claims, password hash, email, and status internals;
- missing or duplicate Authorization;
- malformed Bearer syntax;
- invalid signature, issuer, or audience;
- expired token;
- nonexistent subject;
- inactive User;
- current persisted username and role returned rather than token role data;
- no additional permission beyond authentication; and
- existing Login and middleware regressions.

Tests must isolate external services and require no local `.env`, InfluxDB connection, or
external network service.

### Mandatory `.http` tests

The required file is:

`backend/testing/auth.http`

It must contain safe manual examples for:

- `POST /api/v1/auth/login`; and
- `GET /api/v1/auth/me`.

It must not commit a real username, password, access token, secret, or private
environment-specific value.

Credentials and tokens must be supplied at execution time through safe prompts, ignored
local environment values supported by the REST client, or equivalent non-committed
variables.

The `.http` examples supplement automated Supertest coverage; they do not replace it.

### Frontend tests

Tests must cover:

#### Permission vocabulary and routes

- `CONFIGURATION_READ` protects `/monitored-areas`;
- `CONFIGURATION_READ` protects `/configuration`;
- no `CONFIG_READ` alias exists;
- `/` requires `DASHBOARD_READ`;
- `/users` requires `USER_MANAGE`;
- `/users` is visible only to `ADMIN`;
- `/users` performs no User API request;
- `/foundation` remains an authenticated redirect to `/`;
- direct known-route denial renders Not Authorized;
- unknown paths render Not Found; and
- centralized navigation filtering.

#### Login and safe return

- username autocomplete is `username`;
- password type is `password`;
- password autocomplete is `current-password`;
- keyboard submission;
- progress and disabled submission;
- generic invalid-credentials messaging;
- safe validation, network, malformed-response, and server-error messages;
- accessible labels, errors, announcement, and focus;
- safe permitted internal return routes;
- rejected external URLs;
- rejected protocol-relative URLs;
- rejected `/login` return targets;
- rejected unknown or unsafe targets;
- rejected routes not permitted for the restored role;
- authenticated access to `/login` redirects to `/`; and
- browser Back after Logout cannot reveal protected content.

#### Storage and expiry

- storage read/write/clear;
- supported version restoration;
- unsupported version rejection;
- malformed JSON;
- missing, extra, or incorrectly typed fields;
- storage access and quota failures;
- no memory or `localStorage` fallback;
- expiry calculated from the validated response value;
- no hard-coded `1800` lifetime;
- expiry at startup;
- timer-driven expiry;
- focus and visibility expiry checks; and
- timer cleanup.

#### Restoration and error handling

- successful `/auth/me` restoration;
- current Backend principal replacing the Login snapshot;
- `/auth/me` `401`;
- `/auth/me` network failure;
- `/auth/me` `5xx`;
- malformed `/auth/me` success response;
- unexpected `/auth/me` `403` entering `restoration-error`;
- `/auth/me` `403` never rendering the shell or normal Not Authorized;
- Retry;
- Logout;
- expiry during restoration error; and
- no protected-shell flash during initialization, restoration, or restoration error.

#### API-client security

- caller-supplied Authorization is rejected in public mode;
- caller-supplied Authorization is rejected in protected mode;
- Login has no Authorization header;
- protected mode injects exactly one adapter-controlled Bearer header;
- Login `401` does not invoke global invalidation;
- protected-request `401` cancels and clears authenticated state;
- normal `403` preserves session and QueryClient state; and
- token, password, Authorization, and raw session data are never rendered or logged.

#### AppShell and regression coverage

- sanitized username and role are displayed;
- localized accessible Logout is available;
- token and password are never displayed;
- provider integration through `AppProviders → App`;
- desktop and mobile Drawer contracts;
- mobile dismissal and focus restoration;
- skip-link and keyboard behavior;
- reduced-motion behavior;
- English/LTR operation and RTL architectural compatibility;
- 320px-safe CSS contract;
- approved layering; and
- all existing S14-01 and S14-02 regressions.

Real-browser geometry must not be claimed unless measured by a real browser runner.
JSDOM may verify CSS contracts only.

## Acceptance Criteria

S14-03 is implementation-complete only when:

1. This ADR is approved before implementation.
2. `/auth/me` returns exactly the approved sanitized principal.
3. `/auth/me` reuses the middleware-resolved persisted User.
4. Login uses the exact existing contract.
5. `expires_in: 1800` remains only an illustrative configured example and no frontend
   lifetime is hard-coded.
6. The strict versioned storage adapter is fully tested.
7. No alternative persistence or fallback exists.
8. Startup and reload use `/auth/me` before protected rendering.
9. Network, `5xx`, malformed response, and unexpected `/auth/me` `403` enter
   `restoration-error`.
10. Unexpected `/auth/me` `403` never renders the shell or normal Not Authorized.
11. Local expiry continues during restoration error.
12. Login persistence failure fails closed.
13. Protected-request `401` clears session and QueryClient state.
14. Login `401` remains a generic local Login error.
15. Normal protected-operation `403` preserves the session.
16. No continuous role polling or JWT role decoding exists.
17. The exact permission vocabulary is used, including `CONFIGURATION_READ`, with no
    `CONFIG_READ` alias.
18. `/` requires `DASHBOARD_READ`.
19. `/monitored-areas` and `/configuration` require `CONFIGURATION_READ`.
20. `/users` requires `USER_MANAGE`, is ADMIN-only, and remains non-operational.
21. `/foundation` remains an authenticated redirect to `/`.
22. Safe-return validation rejects external, protocol-relative, `/login`, unknown,
    unsafe, and unpermitted targets.
23. Authenticated access to `/login` redirects to `/`.
24. Browser Back after Logout reveals no protected content.
25. The AppShell safely displays sanitized username and role.
26. Caller-supplied Authorization is always rejected.
27. Existing accessibility, responsive, focus, localization, RTL-readiness, 320px CSS,
    and layering contracts remain successful.
28. Automated Backend Supertest coverage succeeds.
29. `backend/testing/auth.http` contains safe manual Login and `/auth/me` examples.
30. All Frontend, Backend, coverage, audit, build, and repository gates pass.
31. No dependency, migration, workflow, VERSION, CHANGELOG, tag, Release, or deployment
    change is included.
32. Status-documentation texts are separately presented and approved before editing.
33. S14-04 has not started.

## Accepted Risks and Mitigations

| Risk | Decision and mitigation |
| --- | --- |
| Browser storage can be read by successful same-origin script injection | Use only tab-scoped `sessionStorage`; prohibit unsafe HTML and sensitive logging; retain existing security headers |
| No server logout or revocation | Clear local session and caches; do not claim server invalidation |
| Role changes after restoration | Use `/auth/me`, never JWT role decoding, and keep Backend authorization authoritative |
| No continuous role polling | Accept restoration-time freshness; honor later Backend denial |
| Backend outage during restoration | Hide shell and protected content; retain only an unexpired record; provide Retry and Logout |
| Unexpected `/auth/me` `403` | Treat as restoration error, not normal authorization denial; never render authenticated shell |
| Storage unavailable | Fail closed without memory or `localStorage` fallback |
| Concurrent request completion after Logout or `401` | Block new operations, use abort signals, cancel queries, clear QueryClient, and make invalidation idempotent |
| Modified client bypasses frontend guards | Treat frontend guards as presentation; require Backend enforcement |
| User-editable session record | Strictly validate it and revalidate through `/auth/me` |
| Unsafe return target | Retain only React Router state and validate against known permitted internal routes |
| Browser history after Logout | Clear state before replacement navigation and re-run guards on all protected routes |
| Local clock affects expiry | Use local expiry as a fail-closed additional control while Backend token expiry remains authoritative |

## Consequences

### Positive

- Browser reloads can restore a valid tab-scoped session.
- The UI presents the current persisted username and role.
- Login, restoration, expiry, Logout, `401`, and `403` behavior is explicit and testable.
- Protected content cannot appear before restoration.
- Route and navigation policy is centralized.
- Existing Backend RBAC remains authoritative.
- No dependency, migration, or server-session infrastructure is added.

### Trade-offs

- Closing the tab ends persisted browser state.
- Logout does not revoke an issued token on the server.
- Temporary Backend failures produce a restoration screen.
- Roles are refreshed during restoration, not continuously.
- `/users` provides no User Management operations.
- Frontend permission checks cannot provide security without Backend enforcement.

## Alternatives Considered

### `localStorage`

Rejected because it persists beyond the approved tab session.

### Cookies or server-side sessions

Rejected because they require a different Backend and CSRF architecture.

### Refresh tokens

Rejected because issuance, rotation, reuse detection, storage, and revocation are outside
S14-03.

### JWT role decoding

Rejected because the current persisted Backend User is authoritative.

### Continuous `/auth/me` polling

Rejected to avoid unapproved identity polling and traffic.

### Memory-only persistence fallback

Rejected because it silently changes session behavior after storage failure.

### Silently overriding caller Authorization

Rejected. Caller-supplied Authorization is deterministically rejected in public and
protected modes.

### User Management UI

Rejected because `/users` is limited to an ADMIN-only placeholder.

## Explicit Exclusions

S14-03 excludes:

- `localStorage`;
- cookies;
- refresh tokens;
- server-side sessions;
- token revocation;
- server Logout;
- JWT role decoding;
- continuous role polling;
- password recovery or reset;
- multi-factor authentication;
- User Management operations;
- new roles, permissions, or permission aliases;
- tenant or site authorization redesign;
- Asset or Monitoring Point APIs/UI;
- MQTT;
- telemetry changes;
- Alarm-domain changes;
- Dashboard DTO, calculation, widget, or data work;
- Arabic translations;
- full RTL styling;
- dark mode;
- new dependencies;
- database migrations;
- workflow changes;
- `VERSION` changes;
- `CHANGELOG.md` changes;
- tags, Releases, or deployments; and
- S14-04 or later-story work.

## Documentation Policy

This ADR is the architecture proposal for S14-03.

No project-status document may claim that implementation has started or completed merely
because this text has been prepared or approved.

After implementation and verification, exact proposed text for each affected
status document must be presented separately and approved before editing.

`VERSION` and `CHANGELOG.md` remain unchanged throughout S14-03 implementation. They may
change only at an approved Sprint completion or release stage.

## Implementation Sequence

This sequence is approved as the implementation order. Acceptance of this ADR does not
authorize its execution:

1. Record ADR-021 as Accepted before implementation.
2. Issue separate implementation authorization and verify the protected baseline.
3. Create the authorized S14-03 branch.
4. Implement minimal `/auth/me` behavior using `req.user`.
5. Add Backend unit, integration, security, and Supertest coverage.
6. Add safe Login and `/auth/me` examples to `backend/testing/auth.http`.
7. Implement typed authentication contracts and strict response validation.
8. Implement the versioned `sessionStorage` adapter.
9. Implement authentication state, restoration, expiry, and local Logout.
10. Extend the API client with deterministic Authorization rejection and controlled
    protected-header injection.
11. Integrate TanStack Query cancellation and clearing.
12. Implement the accessible Login and safe-return policy.
13. Implement restoration-error and Not Authorized behavior.
14. Protect existing routes and preserve `/foundation → /`.
15. Add the ADMIN-only `/users` placeholder.
16. Add the AppShell identity and Logout presentation.
17. Run all Frontend, Backend, audit, coverage, build, and repository gates.
18. Review the complete diff against this ADR.
19. Present exact status-documentation updates for separate approval.
20. Commit, push, and open or update a Draft PR only under separate authorization.
21. Keep `VERSION`, `CHANGELOG.md`, tags, Releases, deployments, and S14-04 unchanged.

## Final Decision Summary

S14-03 will implement a tab-scoped, versioned, strictly validated frontend session using
`sessionStorage`, restore the current persisted principal through
`GET /api/v1/auth/me`, and present the exact established Backend RBAC vocabulary through
centralized route and navigation metadata.

`CONFIGURATION_READ` is the exact configuration read permission. No `CONFIG_READ` alias
exists.

The Backend remains authoritative. The frontend does not decode JWT roles, accept
caller-supplied Authorization, implement server Logout or refresh tokens, or treat hidden
navigation as security enforcement.

This ADR is Accepted as the governing S14-03 architecture. Acceptance alone does not
indicate that implementation has started or completed.
