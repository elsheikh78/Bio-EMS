# BIO-EMS Customer Monitor

Reviewed candidate `d151b1f`, 28 October 2026. [Project state](../PROJECT_STATE.md) controls merge/deployment status.

Separate Expo/React Native 0.1.0 read-only customer monitor. Fixed HTTPS cloud API, isolated native Viewer bearer session and secure storage. Multi-site/room/sensor/alarms and foreground operation must respect snapshot freshness.

## Verify from this directory

```sh
npm ci
npm run typecheck
npm test
npm run export
```

Source API in `src/api.ts` constrains origin, rejects redirects and applies timeout/response validation. Native background remote push is not implemented. Expo export does not establish native compilation, signing, TestFlight/store publication, locked-screen delivery or physical-device acceptance.

[Current component guide](../docs/current/CLOUD-AND-MOBILE.md) · [Developer/testing guide](../docs/current/DEVELOPER-AND-TESTING.md) · [Audit findings](../docs/audit/2026-10-28/README.md) · [Original pre-audit README](../docs/archive/2026-10-28-pre-audit/mobile/README.md)
