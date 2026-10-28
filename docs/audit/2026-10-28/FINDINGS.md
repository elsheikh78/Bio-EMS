# Audit Findings and Closure Criteria

Baseline `d151b1f`; review 28 October 2026. “Open” means no functional fix was made by this audit. Priority is engineering triage; advisory severity is separately reported. Source references are baseline paths/line contexts and must be rechecked after code changes.

## A01 — Critical/High dependency advisories — OPEN, priority 1

Evidence: committed lockfiles and [registry audit evidence](evidence/dependencies.json), [dependency report](DEPENDENCIES.md). Backend all dependencies15 affected entries, production9 (one Critical/six High/two Moderate). Frontend all9, production1 High; cloud all3, production0; each mobile all/production9 (four High/five Low). Overlapping/transitive entries are not unique exploit counts. Tooling advisories can affect developer/build trust even when absent from customer runtime.

Critical production entry is transitive `proxy-addr` (GHSA-jqcg-44mw-7w3h). Its upstream advisory requires unsafe proxy trust-subnet handling; reviewed `app.ts` does not set `trust proxy`. Exploitability is not demonstrated in this application. Upgrade/triage rather than claim unauthenticated takeover. Registry fix suggestions include major upgrades for some development/email packages; automatic force-fix is inappropriate.

Closure: record installed dependency chains, relevant attack preconditions and supported patched versions; update lockfiles in a dedicated reviewed change; run all affected contracts/native packaging; rerun production/all scans and document accepted residual findings explicitly.

## A02 — Customer login has no application throttling — OPEN, priority 1

Evidence: `backend/src/routes/auth.route.ts` directly mounts validation then loginController on `/login`; `app.ts` has no global login limiter. Separate owner/recovery/pairing limiters do not cover this path. Isolated in-memory probe made 21 consecutive wrong-password requests and received 21 HTTP 401 responses without 429. This is not a load test and did not contact a live account.

Impact: online guessing and repeated bcrypt work are not bounded by a customer-login application policy. An external gateway limiter was not inspected. Closure: approve user/IP-aware limit/backoff policy behind the actual proxy topology, avoid account enumeration/lockout abuse, add route-level tests for threshold, recovery window, concurrent requests and valid-login behavior; test deployed proxy IP handling.

## A03 — Customer tokens survive credential replacement — OPEN, priority 1

Evidence: `services/token.service.ts` signs/verifies user subject/expiry without credential/session version. `middleware/authentication.middleware.ts` reloads active user/role/forced-change state but checks no password-change timestamp or token/session revocation. `services/password-recovery.service.ts` and ADMIN recovery replace password hashes. The isolated probe issued a token, replaced the stored credential while leaving the user active and forced-change flag clear, then successfully called `/api/v1/auth/me` with the original token.

Impact: an already-copied customer token can remain valid until expiry despite password change; default 30 minutes, configurable. Forced-password-change can restrict routes temporarily but does not invalidate the token. Disabled/deleted users are rejected; do not claim all auth controls are missing. This finding does not apply automatically to separately database-backed owner/Viewer sessions.

Closure: implement an approved credential/session version or revocable-session design, revoke on own/admin/offline recovery paths, define current-session behavior and ensure role/status changes still apply. Tests must prove old token rejection after every credential-change path, cross-purpose isolation and compatibility through migrations/restore.

## A04 — Company logout does not revoke copied cookie — OPEN, priority 2

Evidence: `company-cloud/src/worker.mjs` admin() verifies HMAC/expiry, login issues a 30-minute cookie, `/api/company/logout` clears the browser cookie. No server per-session identifier/revocation lookup is used. This is source-observed; no live cookie replay was attempted.

Impact: a stolen valid signed company cookie remains valid until its expiry even after user logout. Current company access key is shared rather than individual operator identity. Closure: explicitly accept this pilot model or design revocable individual sessions, audit attribution and key rotation; test logout replay, disabled operator, expiry and secret rotation. Do not confuse this with D1-backed customer Viewer or local owner session revocation.

## A05 — Main pilot skips TLS endpoint-name checking — OPEN, production gate / priority 1

Evidence: `firmware/site-controller-esp32s3/main/main.c` pairing client near line 336 and sample client near 456 set `skip_cert_common_name_check=true` and supply `cert_pem` from USB-provisioned trust. Pilot comment acknowledges compatibility exception. [ESP-IDF 5.5.5 HTTP client documentation](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/protocols/esp_http_client.html) describes this option as skipping server certificate common-name validation. It is not evidence that every certificate validation is disabled.

Impact: endpoint identity checks are weaker; exact exposure depends on whether provisioned trust is a narrow pinned certificate or broader CA and on network/PKI compromise. Current trust provisioning and deployed certificates were not physically inspected. Closure: remove the exception with controlled SAN/hostname/IP certificate provisioning, test wrong-host/replaced/untrusted/expired certificates and both pairing and live/replay transport, then complete approved production device identity/mTLS requirements.

## A06 — Production device protection remains a requirement gap — OPEN / DEFERRED

Pilot binding is implemented; full device PKI/mTLS, protected key lifecycle, Secure Boot/Flash Encryption, signed-device firmware and clone/revocation evidence are not established. Source: firmware boundary comments and retained security specs/ADRs. Closure requires the existing approved work packages and actual security/hardware evidence. This audit preserves deferral; it does not approve production claims.

## A07 — Physical, deployment and recovery coverage incomplete — OPEN

Automated integrated Tester acquisition is one selected Nano/four probes. Manual18-step qualification is not simultaneous sixteen-channel automation. No actual 20 m electrical/calibration/full-population/UPS/RTC/SD/modem/field test was run here. No fresh Windows lifecycle/native mobile build/iOS device/cloud deployment/real provider delivery/restore drill was performed. Native customer background remote push and autonomous controller GSM alarm fallback are not implemented. These limits are now explicit in current guides.

Closure: exact-package/assembly evidence for each [acceptance gate](../../current/QUALIFICATION-AND-ACCEPTANCE.md), approved BOM/sensor map/power limits, instrument traceability and signed field UAT. Earlier historical results cannot certify a newer build.

## D01 — Current state interleaved with old snapshots — DOCUMENTATION CORRECTED

PROJECT_STATE mixed several main SHAs, old test totals and historical work. Root/component entrypoints contained superseded Tester/HardwareLab boundaries. Compact state authority and new guides now distinguish main/candidate/tagged/installed states. Original text and evidence remain hashed in the dated archive. No code/release/field status changed from this correction.

## D02 — Parallel specs and requirements naming — CONTROLLED, further domain reconciliation open

Examples: root versus architecture Design Rules/MQTT documents, overlapping database/roadmap docs, typo path `docs/requirements/unctional-requirements.md`, numerous historical work packages. Domain docs/ADRs were not deleted or silently merged. They retain explicit requirement/evidence boundaries and original copies, with current implementation guides for navigation. Requirement-by-requirement formal traceability and business approval of conflicting policies remain open; a banner is not a claim that every retained statement matches code. The typo entrypoint now points to the canonical functional requirements file; its original remains preserved.

## D03 — Local Markdown reference integrity — VERIFIED, limited scope

The migration ledger evaluated supported Markdown links from all pre-audit non-archive originals relative to their original paths and found **zero missing file targets**. No target repairs or invented substitutions were needed. Active documentation also passes the new file-link checker. Backtick-only path mentions, external URLs, anchor fragments and other Markdown dialects are outside this result; archived bytes remain untouched. The checker now detects missing local links introduced by later changes.

## Remediation order and limits

First triage runtime dependencies and A02/A03/A05, implement separately with desired regression tests and final packaging checks. Then decide company-session hardening and execute hardware/deployment/recovery acceptance. Full production trust remains its approved gated track. Recommended priorities are not an unrecorded architecture approval. This audit adds documentation verification tooling only; no application, firmware, dependency or database behavior was changed.
