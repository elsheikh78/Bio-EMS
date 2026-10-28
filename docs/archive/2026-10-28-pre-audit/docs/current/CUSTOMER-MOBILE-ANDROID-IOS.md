# Customer native mobile app — Android and iOS

## 26 October integration record

PR #306 is merged at 63f399bb1ba5e08b6eabb1915e0b7651219365ee. This source checkpoint does not establish live Worker deployment, physical Android/iOS acceptance or signed/store distribution. Company app evidence is separate.

See [26 October checkpoint](PROJECT-CHECKPOINT-2026-10-26.md).

Implementation location: `mobile/`. This is a native Expo/React Native viewer using the existing customer monitoring backend and accounts. It is separate from the `/viewer/` PWA and company administration portal.

The company Worker adds an explicit bearer-authenticated `/api/mobile/viewer/` namespace with login, overview and per-session logout only. Server session hashing, expiry, customer scope, disabled-account checks and rate limiting are reused. Existing browser login remains cookie-based and same-origin protected. No client Windows Setup, firmware or D1 schema change is required for this mobile feature, but the Worker must be updated.

The app provides Arabic/English native screens, secure session storage, sites/rooms/readings/alarm feeds, timestamps, staleness handling and foreground local sound notifications. It does not perform configuration or acknowledge alarms. Native remote push/background monitoring is not implemented; it requires a separately reviewed delivery pipeline and FCM/APNs credentials. Existing PWA Web Push is unchanged.

See `mobile/README.md` for setup, signed Android/iOS builds and device acceptance. JavaScript bundle export and native project generation are source validation only. APK/IPA signing, physical-device validation and store publication require the owner's accounts and are not completed by adding this source code.
