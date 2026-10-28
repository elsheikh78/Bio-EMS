# BIO-EMS Company Mobile

Reviewed candidate `d151b1f`, 28 October 2026. [Project state](../PROJECT_STATE.md) controls merge/deployment status.

Separate Expo/React Native 0.1.0 restricted WebView shell for the company HTTPS portal. Navigation policy in `src/navigation.ts` enforces the approved origin; the shell inherits cloud identity/permissions. It is not the customer monitor.

## Verify from this directory

```sh
npm ci
npm run typecheck
npm test
npm run export
```

Expo export is not a signed native iOS/Android release. Earlier22 October company Android pilot operation is dated evidence, not a fresh test of every company/owner mutation, MFA, file handling or iOS device. Never embed company access secrets in the application.

[Current component guide](../docs/current/CLOUD-AND-MOBILE.md) · [Developer/testing guide](../docs/current/DEVELOPER-AND-TESTING.md) · [Audit findings](../docs/audit/2026-10-28/README.md) · [Original pre-audit README](../docs/archive/2026-10-28-pre-audit/company-mobile/README.md)
