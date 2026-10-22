# BIO-EMS Company for Android and iOS

## Delivered QA baseline — 22 October 2026

The user reported successful Android app operation (“نجح التطبيق”) after receiving the QA APK. This is an operational smoke result; individual administration, language, System Owner/MFA, file and failure-recovery checks below are still unrecorded. iOS has generated source and Hermes export only, with no native Xcode/device build or signed IPA claimed.

- PR: [#307](https://github.com/elsheikh78/Bio-EMS/pull/307); tested application source `349a7b5b1cbb85da6e4424ec1e182766128dfdae`.
- [Successful mobile build 39842439397](https://github.com/elsheikh78/Bio-EMS/actions/runs/39842439397); artifact `BIOEMS-Company-Pilot-Android-arm64-QA`.
- APK: `BIOEMS-Company-Pilot-Android-arm64.apk`; 26,739,559 bytes; SHA-256 `3094561e4eb0e34d7f68e618aeb26a1dc3b4f31d8e2fa54722930e16321b4fd9`.
- App `0.1.0`, QA package `com.bioemsegypt.company.pilot`, arm64, development certificate; not a store production release.
- [Arabic operations](../docs/current/COMPANY-MOBILE-APP-AR.md); [authoritative project status](../PROJECT_STATE.md). APK artifacts expire under Actions retention; rebuild instructions below remain available. A later rebuild has its own hash and must not be labelled with this artifact's checksum.

A dedicated Expo / React Native app that opens the live company platform in a restricted WebView. Uses the original project logo. The existing portal supplies Arabic / English switching, company authentication, client/site/license management, deletion confirmations and selected-site System Owner access. This is a web-backed mobile shell, not a second implementation of the administration APIs. Internet access and a reachable deployed company portal are required. No cloud deployment or database changes are needed.

The fixed HTTPS origin is `https://bioems-company.bioems-egypt.workers.dev`. Navigation is restricted by parsed exact-origin comparison; external URLs, cleartext, file access, third-party/shared cookies, WebView debugging and media capture are disabled. There is no native message bridge, embedded access key or native credential storage. The existing HttpOnly company cookie and its server-side expiry remain in effect, with an incognito app session. Use the portal's own sign-out action when finished. System Owner retains its existing login/MFA and permissions. The native toolbar asks before home, refresh or back navigation so forms are not discarded accidentally. Session recovery can require signing in again.

The page's language control switches Arabic and English. Native navigation/error dialogs are bilingual. Toolbar controls provide back, home, refresh, and explicit opening of the portal home in an external browser; that browser has a separate login session. Foreign links and popups are not opened automatically. File downloads and some browser-only features may require the external browser. Test file upload/download and System Owner operations on actual devices before distribution.

## Development

```sh
cd company-mobile
npm ci
npm run typecheck
npm test
npx expo install --check
npx expo prebuild --no-install --platform all
npm run export
npm run android
# macOS with Xcode:
npm run ios
```

SDK 57 / React Native 0.86.3. Generated `android/`, `ios/`, exports and build artifacts are ignored. The independent company app IDs are `com.bioemsegypt.company` (Android/iOS), proposed until registered. They do not replace the customer monitoring app.

## Android test installer

`.github/workflows/company-mobile.yml` validates types, navigation policy, native generation for both platforms and both JS bundles. Then it generates a QA Android project using `BIOEMS_MOBILE_QA=1` and builds an arm64 release-mode APK with a development certificate. Artifact: `BIOEMS-Company-Pilot-Android-arm64-QA`, containing APK and SHA256SUMS. This is a test installer, not a store-signed production release. QA name: BIO-EMS Company Pilot; package: `com.bioemsegypt.company.pilot`. It needs neither an Expo nor Google Play account. Verify the APK on physical Android devices; no device login or destructive admin actions are automated.

## iOS and store distribution

iOS source generation and JS export can run on Linux, but do not produce a signed iPhone installer. Use macOS/Xcode for simulator testing. For physical-device distribution via TestFlight or ad hoc builds, configure an Apple Developer team, registered bundle ID, certificates/profiles (and registered devices for ad hoc). After creating an Expo project, `eas build:configure` and the included `eas.json` can configure managed builds; production signing/credentials are not included. App Store review approval is not guaranteed for a web-backed administration app. Store submissions, signing secrets and commercial distribution are outside this QA build.

## Physical-device acceptance

On Android and iPhone: sign in with an authorized company account; switch Arabic/English; inspect client/site/license cards; select a test site's System Owner and complete its existing auth; verify return navigation and keyboard/safe areas; cancel deletion confirmation; verify sign-out and session expiry; disconnect networking and test retry; attempt an external URL and verify it stays blocked. Use a disposable test record for any actual mutation. Automated build checks do not establish authenticated device behavior.
