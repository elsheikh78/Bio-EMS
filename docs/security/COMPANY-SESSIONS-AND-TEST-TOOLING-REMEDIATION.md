# Company Sessions and Test Tooling Remediation

28 October 2026, source candidate following 0246c0d. Requirement/design: [ADR-025](../adr/ADR-025-revocable-company-sessions.md). Original audit records remain immutable; this is new remediation evidence.

## Company session behavior

Company cookies now require a matching hashed D1 session row. Logout revokes the current row, so replaying the copied cookie returns 401; other sessions remain usable. Duplicate/tampered/missing/expired sessions fail. Access-key rotation invalidates existing rows through their key fingerprint. Signing-secret rotation invalidates signatures. Raw cookie/access-key values are not stored in the session table. Viewer/native bearer/local owner sessions remain separate.

Apply additive migration 0003_company_sessions.sql before the matched Worker deployment, then test fresh login, company/owner navigation, mutations and copied-cookie rejection. Existing company users must log in again. This candidate performs no remote migration/deployment. If rolling back to the stateless Worker, rotate SESSION_SECRET; old code otherwise cannot enforce revocation even if the new table remains.

## Test runner migration and dependency evidence

Backend and frontend use Vitest 5.0.5 with matching coverage tooling, requiring Node>=22.12 and Vite>=6.4; the supported Windows/CI Node22.23 line meets this. Preserve prior clearMocks:false semantics explicitly. Backend discovery includes source/database test/spec TypeScript files and excludes compiled dist duplicates by source directory scope. Constructor mocks now use constructable functions; mocked callable interfaces retain explicit typing. The offline recovery fixture lifecycle hook no longer returns a mock as a cleanup callback. Assertions were not removed or weakened; source counts remain 164 backend files/1101 tests and 64 frontend files/357 tests.

Registry npm audit --json reports zero affected entries for backend, frontend and company-cloud, including development tools, on these locked candidate trees. [New scan evidence](evidence/SECURITY-PHASE-TWO-2026-10-28.json) is separate from earlier snapshots. Cloud Wrangler/Miniflare/Undici were updated within the existing supported major. This does not certify mobile/Python/firmware/vendor inputs; mobile SDK/tooling findings remain outside this change. Do not force the registry's suggested Expo downgrade or Zod major override into mobile tooling without compatibility review.

## Remaining transport/device work

Main pairing and telemetry HTTPS clients still skip endpoint-name checks. Installer source currently generates a certificate for localhost and COMPUTERNAME, while provisioning can use a LAN IP. Simply removing the firmware exception would reject those IP-based installations. [TLS work package](MAIN-TLS-ENDPOINT-IDENTITY-WORK-PACKAGE.md) records the specific source gap and required controlled certificate/provisioning changes. No firmware protection is claimed fixed here.

## Executed candidate verification

Backend1101 tests/164 source files, frontend357 tests/64 files and cloud30 tests passed; typecheck/lint/format/build and cloud Wrangler dry-run passed. Frontend Vitest5 coverage command also passed:61.16% statements,49.17% branches,55.4% functions,61.8% lines. This is a measured frontend-only snapshot, not complete branch coverage or security certification. No tests were skipped to obtain these results. D1 remote migration and live cookie replay remain deployment acceptance gates.
