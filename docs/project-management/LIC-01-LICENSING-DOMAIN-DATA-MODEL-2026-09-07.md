# LIC-01 — Licensing Domain and Data Model

**Status:** Complete / merged / CI verified
**Started:** 2026-09-07  
**Authority:** `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`

## Scope

LIC-01 establishes the persistent and typed foundation for site-bound licensing. It does not implement installation keys, hardware fingerprinting, certificate signing, activation APIs or runtime enforcement; those remain LIC-02 through LIC-06.

## Implemented foundation

- A licensing installation is bound to exactly one Platform Customer and one Site.
- It may reference one P8 provisioning installation without merging the provisioning and licensing lifecycles.
- Site-bound licenses carry a schema version, commercial type, controlled status, validity dates, maintenance/update entitlement and a JSON offline-policy envelope for later LIC-08 policy.
- Module entitlements support explicit gateway, device and sensor limits.
- License events are append-only and scoped to the licensing installation.
- Domain types define controlled license states and allowed transitions; revoked and superseded records are terminal.

## Persistence

Migration 022 creates:

- `licensing_installations`
- `site_bound_licenses`
- `license_entitlements`
- `license_events`

The model deliberately does not store `licensed=true`, signing private keys or plaintext installation private keys. Cryptographic identity and protected key storage belong to LIC-02; signed certificate claims and verification belong to LIC-04.

## Local verification

- focused domain and migration tests: passed;
- Backend typecheck, build, lint and formatting: passed;
- full Backend regression: 108 test files / 760 tests passed.

## Integration evidence

- PR: #173
- CI: #597 — passed
- Merge: `90fe361e71f8a4fb79295e0c95344913b66cba35`

LIC-01 is complete. LIC-02 — installation identity and protected key storage — is the controlled next package.
