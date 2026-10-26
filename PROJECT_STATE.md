# BIO-EMS Project State

## 22 October 2026 — company mobile application

- PR #307 adds the separate `company-mobile/` Android/iOS company administration shell using the original logo and the deployed portal in a restricted WebView. It inherits Arabic/English, customer/site/license management and selected-site System Owner workflows, with existing authentication/MFA and permissions.
- Original QA build source: `349a7b5b1cbb85da6e4424ec1e182766128dfdae`; [mobile CI run 39842439397](https://github.com/elsheikh78/Bio-EMS/actions/runs/39842439397) passed typecheck, three navigation/error-policy tests, dependency checks, both native project generation and Hermes exports, Android arm64 compilation, APK signature and package verification. Existing backend/frontend/company CI gates also passed in [run 39842439091](https://github.com/elsheikh78/Bio-EMS/actions/runs/39842439091).
- Delivered `BIOEMS-Company-Pilot-Android-arm64.apk`, app `0.1.0`, package `com.bioemsegypt.company.pilot`, development certificate, SHA-256 `3094561e4eb0e34d7f68e618aeb26a1dc3b4f31d8e2fa54722930e16321b4fd9`. The user reported “نجح التطبيق” on 22 October 2026. This records successful Android app operation, not individual acceptance of every administrative feature.
- Android language switching, administrative mutations, System Owner/MFA, logout/expiry, network recovery and file handling still need individually recorded device results. No physical iPhone result or signed IPA/TestFlight release exists for this app. iOS source/export preparation does not establish an Xcode/native iOS build or device acceptance; Apple signing/distribution setup remains pending.
- Company and customer monitoring apps are separate. No store publication, production certificate, new cloud deployment, database migration, Client Setup or firmware change is included. Platform version remains `0.20.0`; app version is independent.

Operations and evidence: [company mobile guide](docs/current/COMPANY-MOBILE-APP-AR.md); developer/build reference: [company-mobile README](company-mobile/README.md). Earlier dated status sections below retain their original scope.

## 15 October 2026 company customer/activity management

- Adds name-confirmed customer deletion, blocked while any sites remain; transactional
  cleanup of viewer accounts/sessions/subscriptions and retained deletion audit event.
- Activity defaults to five records with keyset More, date-range preview and confirmed
  deletion of stored audit rows. Local telemetry/alarms remain independent.
- Chosen retention option is manual date-range deletion, not weekly automatic archives.
  No new schema, client setup, firmware or product version change. Cloud deployment
  of this source update remains pending.


## 14 October 2026 customer Viewer portal deployed — field acceptance pending

- Adds a separate Arabic/English customer portal at `/viewer/`, responsive PWA shell,
  all-customer-site monitoring, room/sensor details, stale/offline indicators and
  foreground alarm sound with device-local silence.
- Cloud viewer passwords/sessions are separate from company/owner identities.
  Company UI provisions/revokes customer-scoped accounts; Viewer cannot mutate
  operational APIs. Optional installed-site export uses verified installer context.
- Adds D1 migration `0002_viewer.sql`, latest snapshots, VAPID Web Push subscription
  lifecycle and durable deduplicated retry jobs. Export is independently opt-in,
  every 30 seconds; old clients/previous connections retain their existing behavior.
- Local source checks: 1083 backend / 356 frontend tests after #297; 23 cloud tests for #296; typecheck, lint,
  formatting and builds; Wrangler dry-run, real local workerd/D1 auth/export smoke,
  Chromium desktop/mobile RTL/LTR interactions with synthetic fixtures.
- PR #296 merged at `97de7a96207e281b7b7b86640053f72248d2ad21`; D1 migration
  `0002_viewer.sql`, three VAPID secrets and Worker deployment completed on 14 October.
  Live Viewer HTML returned HTTP 200; unauthenticated overview returned HTTP 401.
- PR #297 merged at `377ade8b65e8622a60027b541d4ca8c7ff488679`: unchanged site/origin
  settings reuse the saved encrypted token. Windows setup/health/update CI passed;
  updated client package delivered. Installation of #297 and successful export on
  the customer PC are not yet verified.
- Live customer telemetry/alarm acceptance and real Android/iOS foreground/background
  Push tests remain pending. Native store apps, APK/IPA, developer accounts and
  publication remain phase two. Cloud deployment is not pilot commissioning.
- Version remains 0.20.0; Manufacturer Tools and firmware unchanged.

Operations: [customer Viewer portal](docs/current/CUSTOMER-VIEWER-PORTAL-AR.md);
architecture: [ADR-023](docs/adr/ADR-023-customer-viewer-cloud.md);
deployment evidence: [14 October status](docs/current/VIEWER-DEPLOYMENT-STATUS-2026-10-14.md).

## 11 October 2026 company cloud pilot candidate

- Separate Cloudflare Workers/D1 package adds a company customer/site registry,
  connection status, persisted device/alarm count summaries, monitor-only site
  license records and central operation audit.
- Optional client connection is configured from the local System Owner UI. Remote
  transport reuses local owner authentication/MFA and validated owner routes;
  sensitive request/response payloads are encrypted end to end.
- Company Worker is deployed at `https://bioems-company.bioems-egypt.workers.dev`.
  Company login and creation of the Bio Egypt / Elmanial warehouse record were
  verified on the pilot browser. Installed Windows connection and field acceptance
  are still pending; the existing client predates this connection feature.
- Central records do not issue local signed license certificates or enforce new
  restrictions. Historical telemetry replication and large remote file transfer
  are outside this first connection candidate. One connection per local DB.
- Product version remains 0.20.0. Firmware is unchanged. New client source needs a
  qualified Client Setup before the connection can be used at a customer site.
- Local validation: 1072 backend tests, 356 frontend tests and 9 Worker/D1 adapter
  tests passed. Backend/frontend typecheck, lint, formatting and builds passed;
  cloud asset build and Wrangler deployment dry-run passed. Actual deployment, D1
  migration and initial portal login/site creation succeeded. Client heartbeat,
  remote owner operations and installed-client qualification remain pending.

Operations: [company cloud pilot](docs/current/COMPANY-CLOUD-PILOT-AR.md).

## Automatic ADMIN recovery public trust deployment

- Client staging accepts the company-exported public JSON through `AdminRecoveryTrustKeyring`
  or `BIOEMS_ADMIN_RECOVERY_BUILD_TRUST_PATH`. The Windows workflow can consume the public
  repository variable `BIOEMS_ADMIN_RECOVERY_PUBLIC_TRUST_JSON`. Without an explicit
  override, staging uses the checked-in public `manufacturer-admin-recovery-trust.json`.
- Packaging validates strict Ed25519 public keyrings, active keys, size and duplicate IDs,
  rejects private PEM/extra secret fields, and includes the public file in the checksummed manifest.
- Signed Client Setup deploys it automatically on fresh install and Repair/update into the
  protected licensing directory. Customer recovery remains entirely in the login interface.
- Production requires this artifact. Pilot builds without company public trust remain possible
  for qualification but are not ready for field file recovery. A real company public export
  is included in the repository; the encrypted private key remains with the company.
- Manufacturer Tools and firmware behavior are unchanged; version remains `0.20.0`.

## 11 October 2026 offline customer ADMIN recovery

- Source includes a client request/permit/reset flow with installation, account, challenge,
  expiry and atomic consumption checks. Recovery grants allow only password reset and do
  not issue a customer access token.
- Manufacturer Tools includes a separate ADMIN recovery signer, encrypted Ed25519 key
  generation and public trust export. Company key provisioning is required: no private
  signing key is packaged, and the public login page never establishes trust.
- SQLite migration 033 stores pending requests/restricted grants. Public POST endpoints
  are rate limited; business endpoints remain authenticated.
- Local verification: 1064 backend tests and 354 frontend tests passed, with typing,
  lint, formatting and builds. Windows installed-client and Manufacturer Tools build
  qualification must pass for the resulting source commit before delivery.
- This is source implementation; field acceptance, cloud delivery and production key
  deployment are separate. Product version remains `0.20.0`.

Operations: [offline ADMIN recovery guide](docs/current/OFFLINE-ADMIN-PASSWORD-RECOVERY-AR.md).

## 11 October 2026 installation identity record checkpoint

PR [#290](https://github.com/elsheikh78/Bio-EMS/pull/290) is merged at
`70108f05bfc0f1826edf44db1eb15bc291e0ea33`; source version remains `0.20.0`.

- System Owner Installation configuration now copies/exports the Setup-authoritative
  customer/site identity and host UUID into an informational JSON customer record.
  Export does not submit configuration, export secrets, or authorize a targeted update.
- Host UUID and configuration lifecycle UUID are separate. Common signed Client Setup
  EXEs remain the update mechanism; customer-specific target checks are not implemented.
- Local frontend validation: 348 tests in 63 files plus typecheck/lint/format/build passed.
  Main CI run [38126214712](https://github.com/elsheikh78/Bio-EMS/actions/runs/38126214712)
  and Internal Windows Setup run [38126214721](https://github.com/elsheikh78/Bio-EMS/actions/runs/38126214721)
  passed. Windows build/install, backup/restore and independent client-update tests passed.
- The PR does not change Manufacturer Tools or firmware behavior. Pilot signing remains
  per-build self-signed; stable company signing/rotation is a separate operational step.
  Physical commissioning and customer acceptance remain open.

Operating instructions and build provenance: [Arabic identity/signing guide](docs/current/INSTALLATION-IDENTITY-AND-UPDATE-SIGNING-AR.md).

## 10 October 2026 Pilot integration checkpoint

PR #288 is merged at `98cea574baaecb5b648aa92133982c412856c681`.
Source product version remains `0.20.0`; this is post-release Pilot development,
not a new semantic version or Production acceptance.

- Client Setup includes ADMIN `/system-update`: upload a signed Client Setup EXE,
  review its version/hash, then install or discard. Internet download is disabled
  by default; the future HTTPS adapter requires explicit protected configuration.
- New ESP32-S3 commissioning supports Wi-Fi or W5500 Ethernet with DHCP.
  Controller firmware is `0.1.0-pilot.5`, protocol `1.3`, binding schema `1`;
  SIM-D4 firmware remains `0.1.0-bench.2`. No automatic failover/static-IP UI is claimed.
- Repair preserves the Provisioner token and accepts fresh Base64 and legacy hex
  tokens. It initializes protected update-jobs storage for older installations.
  Original PostUpdate failure evidence is retained before rollback.
- Manufacturer Tools behavior and SIM-D4 firmware were not changed by PR #288.
  Client and controller artifacts must be matched to their source commit.
- Main CI, ESP32-S3 Firmware, Manufacturer Tools and Internal Windows Setup passed.
  Windows run [38078138666](https://github.com/elsheikh78/Bio-EMS/actions/runs/38078138666)
  passed install/health, Influx backup/restore, token/ACL regressions, real API
  update dispatch/Repair, identity and secret preservation, tamper rejection,
  and controlled New Install over an existing installation.
- Physical W5500/RS485/power/endurance, live 2G fallback and customer acceptance
  remain separate gates. BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

Operating details: [network and client updates](docs/current/PILOT-NETWORK-AND-CLIENT-UPDATES.md).


## 30 September documentation and source reconciliation

- Reviewed against `main@6efd78a9fd9ea50a1d1b0e88f074708be1189546`; source version remains `0.20.0`. This documentation update creates no new software release or installer artifact.
- Installation Builder and local USB Device Provisioning are present in source: logical configuration -> validate -> queue -> detect ESP32-S3 -> Flash & Bind -> runtime inventory activation. Physical end-to-end acceptance remains open.
- Controller firmware candidate is `0.1.0-pilot.4`, MQTT protocol `1.3`, binding schema `1`; SIM-D4 Nano bench firmware is `0.1.0-bench.2`. Version identifies compatibility; hardware UID and platform binding identify the physical Device.
- MAIN-16-2G / SIM-D4 (1–4 SIM units, up to four probes each) remains a bench candidate. Source now includes Nano Modbus firmware, ESP32 polling, populated-module discovery/channel mapping and HTTPS telemetry. The RS485 bench interface contract is HW-519 automatic-direction TTL-to-RS485; Nano D6 and ESP32 GPIO16 are not used for direction control. Physical RS485/probe qualification and integrated 2G fallback remain open.
- PT100 modular field baseline and DS18B20 bench candidate remain separate pending the controlled sensor decision. El Manial documents count seven positions; planning also mentions six. Resolve the approved position map before full procurement/commissioning.
- SYSTEM_OWNER Pilot-host commissioning/MFA passed on 23 September. This is separate from Production key ceremony and multi-machine qualification.
- COM-01–06 are merged; live COM-07/SMS and field acceptance remain open. Historical provider results retain their dated evidence boundaries.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**. Final Device PKI/mTLS/Secure Boot/Flash Encryption remains deferred.

Sections below are dated checkpoints, not unresolved statements overriding this checkpoint. ADMIN currently lacks `TOPOLOGY_MANAGE` in `frontend/src/authorization/permissions.ts`; any earlier approval for ADMIN topology creation must be reconciled with backend policy before claiming that capability. Installation Builder exposes codes and channel mappings; its normal controls do not yet expose all alarm thresholds. Customer Configuration provides the existing threshold-editing path.


**State date:** 11 October 2026
**Current integration checkpoint:** `70108f05bfc0f1826edf44db1eb15bc291e0ea33` (PR #290; the 30 September full audit remains dated evidence)
**Current integration branch:** `main`
**Current source-software version:** `0.20.0`  
**Latest published source release:** `v0.20.0`

## 27 September Installation Builder & Device Provisioning product decision checkpoint

- Approved product sequence: Setup / Installation Identity -> Installation Builder -> Validate -> Device Provisioning -> Flash & Bind -> Hardware Test -> Commission.
- Customer and Site identity collected during Windows Setup are authoritative inputs and must not be manually re-entered in normal SYSTEM_OWNER installation authoring.
- The current single-row Installation Configuration create flow is superseded as the target UX: the product requires a full Builder for multiple Areas, Telemetries, Devices and channel mappings before physical provisioning.
- Normal authoring must expose a complete code/mapping inventory and generate collision-checked Telemetry/Device identifiers; editable JSON remains an advanced diagnostic/review surface only.
- Installation Configuration and Device Provisioning are now explicitly separate concepts: the logical installation is validated first, then a physical ESP32 is attached to an existing logical Device.
- The current 12-digit code + serial-console flow remains a Pilot bootstrap mechanism, but the approved normal provisioning UX is one-click **Flash & Provision Device** from BIO-EMS with the short-lived bootstrap credential orchestrated internally.
- Preferred Windows architecture is Frontend -> Backend -> local Device Provisioning Service -> USB/COM flashing tool -> ESP32, with deterministic logs, board detection, recovery and post-flash verification.
- El Manial will be entered as a complete logical installation through the new Builder before the first physical controller is provisioned.
- Detailed authority: `docs/project-management/INSTALLATION-BUILDER-DEVICE-PROVISIONING-WORK-PACKAGE-2026-09-27.md`.
- This decision does not change BIO EGYPT acceptance status: **NOT COMMISSIONED / NOT ACCEPTED**.

## 24 September modular hardware architecture checkpoint

- BIO-EMS hardware is now approved for detailed design as five modular blocks: `SC`, `SIM-T2`, `SIM-T4`, independent `COM-CELL`, and `PDU-24`.
- The previous direct-DS18B20/all-in-one Site Controller direction is superseded for new Pilot hardware.
- New temperature hardware baseline: PT100 3-wire probes, independent MAX31865-class front end per populated channel, local SIM conversion, and RS485 field-bus transport.
- 24 VDC is the approved field-power backbone. Target device input design range is 18–30 VDC; low-voltage rails are generated locally inside each module.
- Wired Ethernet is the preferred fixed-site Platform path from Site Controller; cellular/SMS is separated into COM-CELL.
- El Manial and CPC / 6th of October Pilot hardware will use qualified ready-made modules with no BIO-EMS custom PCB; a common production PCB remains a post-Pilot optimization after field validation.
- El Manial cost-optimized baseline is now 1 × SC, 2 × SIM-T4, 1 × COM-CELL, 1 × PDU-24 and 7 × PT100 probes. SIM-T4-A serves the two Cold Room probes plus the Anti-chamber probe (one spare channel); SIM-T4-B serves the four Dry Warehouse probes. This remains subject to field-route verification.
- HW-SIM-01 now prefers one integrated 4-channel PT100 -> RS485/Modbus acquisition module per SIM-T4 for the no-custom-PCB Pilot, eliminating separate SIM MCU/MAX31865/RS485/DC-DC boards where the qualified module provides those functions.
- Pilot hardware sourcing is now constrained to Egyptian local stock only; direct import/cross-border marketplace procurement is not allowed. The previously selected PTA8C04 is therefore superseded as a purchase candidate unless an Egyptian seller later confirms local stock. The SIM-T4 acquisition-core candidate is reopened pending local supplier discovery.
- Any local SIM-T4 candidate must pass bench accuracy, repeatability, 3-wire compensation, RS485 addressing and power-cycle persistence before field purchase is expanded. MAX31865 may only be used if Egyptian local stock is actually confirmed; otherwise another locally stocked RTD front-end path must be qualified.
- Current local Rev.A SIM-T4 bench candidate is four independent AD7793 front ends (one per PT100 channel) plus local MCU, RS485 and 24 V->5 V modules. MOKWN currently lists AD7793 at EGP 470/In Stock, but the supplied form factor must be confirmed as an assembled module/breakout before purchase. Cheap 74HC4052/4053 multiplexing is not approved for Rev.A because switch-resistance mismatch is an avoidable RTD error source.
- Known Rev.A electronics subtotal is about EGP 2,390 per SIM-T4 before precision reference resistors, terminals, protection and enclosure; provisional complete Pilot target is about EGP 2,600-3,100 per SIM-T4 before calibration. A two-ADC + low-signal-relay Rev.B may be evaluated later for cost-down after Rev.A proves accuracy/stability.
- Rev.A first-channel operating point is now calculated: 5 V AD7793 supply, 2 × 210 uA matched excitation currents, 4.7 kohm precision ratiometric reference, gain 64, unipolar AIN1 measurement and 16.7 Hz update rate. This gives ~1.974 V external reference and ~146.875 ohm nominal full-scale RTD resistance. The RREF purchase spec targets <=0.1% and <=10 ppm/degC; exact Egypt-local stocked part remains open.
- Current local web survey still has no confirmed in-stock 4.7 kohm <=0.1% / low-TCR RREF. A 4.7 kohm 1% / 100 ppm part may be used only for functional bring-up with its measured value recorded; it cannot close the accuracy gate. The MOKWN CJMCU-style breakout has no trustworthy published board-level pin legend, so the received board must be continuity-mapped to AD7793 IC pins before power is applied.
- Detailed authority: `docs/hardware/HW-SIM-01-PILOT-SIM-T4-NO-CUSTOM-PCB-2026-09-24.md`.
- Detailed design proceeds HW-PWR-01 -> HW-SIM-01 -> HW-SC-01 -> HW-CELL-01 -> HW-MECH-01 -> HW-MNL-BOM-01 -> HW-BENCH-01.
- PDU-24-S5 is standardized around 24 V / 5 A with upstream customer/site UPS when backup is required; internal battery/DC-UPS duplication is superseded. Immediate hardware work is executable PDU Rev.A plus HW-SIM-01 module selection/bench design.
- Architecture authority: `docs/hardware/BIO-EMS-MODULAR-HARDWARE-ARCHITECTURE-2026-09-24.md`.
- El Manial baseline: `docs/pilot/bio-egypt/EL-MANIAL-HARDWARE-DESIGN-PROCUREMENT-BASELINE-2026-09-24.md`.
- This is architecture/design approval only. PCB release, exact MPN BOM, field cable lengths, calibration, installation, commissioning and acceptance remain open.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## 23 September ESP32-S3 Pilot pairing v1 checkpoint

- PR #254 is merged to `main` at `57ff5748f130e09994fd3aee804197a1cf3d8193`.
- BIO-EMS now has a source-implemented ESP32-S3 Pilot pairing/bootstrap foundation using one common firmware build rather than a per-customer firmware image.
- Current Pilot version contract: controller firmware `0.1.0-pilot.4`, SIM-D4 Nano bench firmware `0.1.0-bench.2`, protocol `1.3`, binding schema `1`, controller model `BIO-EMS-SC-V1`.
- The implemented identity chain is logical installation -> configured Device ID -> ESP32 hardware UID -> stable `platform_binding_id`.
- SYSTEM_OWNER Installation Configuration can generate a single-use 12-digit pairing code valid for 10 minutes. Only a derived hash is persisted by the platform.
- Pairing claim is rate-limited and rejects replay, expiry, duplicate active hardware binding, wrong configured firmware version and wrong Pilot protocol version.
- SQLite migration 030 persists pairing sessions and durable device-platform bindings with immutable/auditable identity fields.
- Once a Device has an ACTIVE platform binding, backend telemetry/heartbeat processing requires matching binding/hardware evidence and rejects mismatches.
- ESP32-S3 firmware source and CI build are present under `firmware/site-controller-esp32s3/`.
- Final PR #254 evidence is green: CI run `35896866656`, firmware run `35896866666`, Internal Windows Setup run `35896866635`, Manufacturer Tools run `35896866580`.
- Flashable firmware artifact ID `10767107823`, SHA-256 `437795554793189233f64e7cf3520c697118090d1a79df0843a1c5c05fe6ab88`.
- Detailed implementation record: `docs/project-management/ESP32-S3-PILOT-PAIRING-V1-IMPLEMENTATION-2026-09-23.md`.
- This is source/CI evidence only. Physical board flashing, first real pairing, MQTT publishing, RS485 sensor acquisition, power/reconnect/endurance testing and commercial Device PKI/mTLS remain open.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## 23 September SYSTEM_OWNER physical Pilot checkpoint

- The manufacturer-controlled SYSTEM_OWNER path has now been exercised end to end on the installed Windows Pilot host: commissioning request -> company-side signing -> signed package import -> isolated owner creation -> MFA enrollment -> MFA activation -> MFA-protected login -> protected System Owner console.
- The final browser session reached `https://localhost/system-owner` and was signed in as `system-owner`.
- Read-only database evidence after activation confirmed an active owner principal, an enabled MFA timestamp, stored encrypted MFA state and no lockout.
- Physical troubleshooting exposed and closed four concrete defects through PRs #248-#251: installed Node runtime discovery, protected `backend.env` loading for owner-package import, controlled MFA enrollment-token handoff, and safe resume of pending MFA enrollment after short-lived token expiry.
- Final merged fixes are represented by main commit `6d2b25ef35f48d5a87df0f2073e46cddd6deca48`.
- PR #251 CI passed and Internal Windows Setup run `35855353686` passed the signed Pilot Setup/build/install/health workflow.
- Evidence record: `docs/archive/project-management/SYSTEM-OWNER-E2E-PILOT-ACCEPTANCE-2026-09-23.md`.
- This closes the immediate Pilot-host SYSTEM_OWNER commissioning/MFA/login verification item only. COM-07, multi-machine qualification, hardware validation, BIO EGYPT field commissioning/UAT, Production security acceptance and final commercial protection remain open.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## 22 September integration and repository checkpoint

- PR #239 is merged to `main`, integrating SYSTEM_OWNER security, managed communication channels, password recovery, installation lifecycle and verified platform backup/restore.
- PR #240 is merged to `main`, correcting Windows/Linux portability assumptions in the backend test suite without changing production runtime behavior.
- Current Windows verification passed the full Backend suite: 137 test files / 965 tests, plus typecheck, lint and format checks.
- PR #240 CI and Internal Windows Setup both passed before merge.
- Repository hygiene audit found 257 branches at audit start. Historical branch cleanup is tracked by `docs/project-management/REPOSITORY-CLEANUP-2026-09-22.md`.
- BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**; source integration does not replace physical commissioning/UAT evidence.

## 21 September physical Repair checkpoint

- Physical Repair on the same legacy Pilot host now passes end to end while preserving the existing BIO-EMS state.
- The repaired lifecycle handles protected legacy MQTT `mosquitto.db` ACLs and no longer mistakes successful non-zero `robocopy` result codes for health failures. The recovered health evidence passed every service, HTTPS, InfluxDB, MQTT, frontend and firewall check.
- A clean machine can no longer continue through `Reinstall / Repair`: interactive and silent Repair require both the registered BIO-EMS installation and controlled services. Clean and partial-state hosts are directed to controlled `New Install` instead of producing a false-success incomplete installation.
- Regression coverage enforces the Repair precondition. CI and Internal Windows Setup must pass on the formatted guard commit before a replacement Pilot artifact is accepted.
- PR #239 remains unmerged until the remaining physical acceptance gates pass.
- The application now exposes **Backup & Restore** to customer ADMIN users and a corresponding System Owner module. Both provide on-demand complete backup and controlled restore; System Owner additionally receives the disaster-recovery identity-transfer path.
- Optional automatic complete backups are source implemented with durable settings for every 6 hours, 12 hours, 24 hours or 7 days, configurable retention from 1 to 30 backups, next/last-run evidence and recorded failure status. Manual backup remains independently available.
- Backend and frontend quality gates passed for this source implementation. Physical browser exercise of manual backup, scheduled execution, retention and restore remains an open acceptance gate.

## 19 September integration checkpoint

- PR #239 is the current stacked integration line and contains the work carried forward from PRs #233, #235 and #237 plus DEP-BR.
- Manufacturer owner key fingerprint is verified as `495ae8e780a32b671518f06a371612b884327e899b67ca0483a21813be50fb81`; the repository trust keyring matches it and an automated fingerprint test is present.
- Physical New Install reached healthy services/HTTPS and ADMIN login. A stale cached customer login shell was reproduced at bare `/login`; cache-busted navigation loaded the current UI. A cache revalidation fix is under CI/Windows verification and requires physical retest without `?fresh` or hard refresh.
- Physical SEC-OWNER commissioning, MFA enrollment/login, Repair preservation, and Backup/Restore historical telemetry acceptance remain open. PR #239 must remain unmerged until those gates pass.
- PR #138 is stale/conflicted documentation and is not an authoritative merge candidate.

## Current phase

**PILOT STABILIZATION / QUALIFICATION.**

Source software is mature and full CI is green, but the BIO EGYPT Pilot is still **NOT COMMISSIONED / NOT ACCEPTED**. The next controlled priority is not final commercial protection. The immediate sequence is:

1. execute HW-PWR-01 for El Manial and freeze the 24 V/PDU power design;
2. design/bench SIM-T2/T4, then SC, COM-CELL and mechanical/cabling layers;
3. complete the exact El Manial BOM and integrated seven-channel bench simulation;
4. execute the first real ESP32-S3 platform pairing and MQTT/RS485 integration on the resulting hardware path;
5. verify Communication Channels/COM-07 and continue Windows installer/Backup-Restore qualification in parallel;
6. complete hardware qualification, then BIO EGYPT field commissioning/UAT;
7. stabilize defects;
8. then complete deferred final Device PKI/mTLS/Secure Boot/Flash Encryption/commercial protection.

Master audit:
`docs/archive/project-management/COMPLETE-AUDIT-MASTER-EXECUTION-PLAN-2026-09-11.md`.

## Repository / CI baseline

- Current authoritative `main`: `57ff5748f130e09994fd3aee804197a1cf3d8193` (ESP32-S3 Pilot pairing v1 through PR #254 merged).
- PR #239 merged the current security/communication/password-recovery/installation/backup-restore integration.
- PR #240 CI and Internal Windows Setup passed before merge.
- Latest verified quality baseline:
  - Backend: typecheck/build/lint/format passed; 137 test files / 965 tests passed.
  - Frontend: typecheck/lint/format/build passed; 56 test files / 311 tests passed.
- No new product version/release is created by this audit.

## Established software baseline

The following remain established source baselines:

- P0-P7 source/product closure.
- P8-02 through P8-08 source closure.
- Arabic/English localization and RTL/LTR navigation.
- UX-01 through UX-09 product refresh.
- Dashboard, Monitored Areas and Live Board telemetry refresh/reconnect behavior.
- Alarm acknowledgment-to-recovery correction.
- Recipient Directory and Escalation Policy configuration.
- Durable notification delivery architecture.
- Email and Telegram live Critical Alarm delivery evidence.
- LIC-01 through LIC-13 previously merged source work.
- DEP-01-01 through DEP-01-05 source work.

Historical closure remains historical evidence and must not be rewritten to imply current field acceptance.

## Notification position

### Proven

- Email live delivery passed.
- Telegram live delivery passed.
- End-to-end Critical Alarm -> Email + Telegram path passed.
- Recipients/Escalation Policies are application-managed.

### Planned / open

- COM-01 through COM-06: **SOURCE MERGED TO MAIN / SOFTWARE VERIFICATION COMPLETE**.
- COM-07: **LIVE ACCEPTANCE PENDING**.
- Meta WhatsApp live acceptance: **OPEN / externally blocked**.
- SMS/GSM live delivery: **OPEN**.
- Telegram remains the approved interim online channel while WhatsApp is blocked.

Authority:
`docs/project-management/COMMUNICATION-CHANNEL-ADMIN-CONFIG-WORK-PACKAGE-2026-09-11.md`.

## Windows Setup position

Installer progress after PRs #199-#203:

- PR #199: repeatable GitHub Actions single-EXE internal Setup artifact.
- PR #200: internal build-scoped Authenticode signing for BIO EGYPT Pilot artifacts.
- PR #201: one-click elevated Pilot launcher with certificate trust and signature check.
- PR #202: automatic Pilot installation diagnostic log.
- PR #203: correction for clean-device/partial-install service-installation failure path.

Therefore the installer is no longer “not implemented.”

**Updated evidence / still open:**

- Clean Windows automated Pilot Setup/install health is verified on the current integration line (PR #235, Internal Windows Setup run #330).
- A separate 16 September clean-install exercise from commit `e48bba4` verified the three BIO-EMS services Running, successful customer ADMIN login, and no automatic SYSTEM_OWNER creation.
- Still open: reboot recovery evidence, Repair/Upgrade/rollback, retained-data Uninstall acceptance, repeatability on an additional clean physical PC, and final Production signing/publication.

## Communication Channel Administration

Status: **COM-01 THROUGH COM-06 MERGED / COM-07 LIVE ACCEPTANCE PENDING**.

Current evidence:
- PR #235 implemented COM-01 through COM-06 and the work is now integrated into `main` through PR #239.
- The integrated source passed subsequent CI and Internal Windows Setup verification through PR #240.
- COM-07 remains open for real Email/Telegram/WhatsApp/SMS and local modem/SIM evidence where applicable.

## Hardware / field position

Hardware remains a separate evidence track.

Open:

- Pilot controller BOM freeze;
- sensor/controller bench validation;
- device/Site/Area/Sensor mapping with physical hardware;
- real telemetry/reconnect/buffering/replay;
- power/reboot tests;
- live SMS/GSM fallback;
- endurance/72-hour evidence where applicable;
- calibration evidence;
- BIO EGYPT physical installation;
- commissioning and customer acceptance.

## Security / commercial protection position

Approved architecture remains authoritative:

- `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`
- `docs/security/device-registration.md`
- `docs/security/activation-workflow.md`

However, the latest product decision is to **defer final commercial protection/device-trust implementation until Pilot Setup and hardware are stable**.

PR #254 now provides a deliberately limited Pilot pairing/bootstrap bridge: short-lived pairing code, hardware UID, stable logical-installation/device binding and binding-aware backend checks. It does **not** implement the Production certificate hierarchy, per-device private keys, mTLS, secure-element/eFuse protection, Secure Boot, Flash Encryption, signed firmware, revocation lifecycle or clone detection.

DEV-TRUST-01 through DEV-TRUST-11 therefore remain the Production-grade architecture/work packages; PR #254 is Pilot implementation evidence only for the pre-PKI pairing foundation.

This does not delete earlier licensing source work; it separates existing source controls from the later production-grade device PKI, mTLS, Secure Boot/Flash Encryption, host-transfer and commercial qualification layer.

## Release position

- Product source authority: `VERSION = 0.20.0`.
- Backend package: `0.20.0`.
- Published GitHub source release: `v0.20.0`.
- `release-manifest.json`: `0.20.0`.
- No new release/version until a deliberate release decision after the next software milestone.

## Current execution order

1. COM-01 -> COM-06 source implementation and CI.
2. Build fresh controlled Pilot Setup.
3. Multi-machine clean Windows qualification.
4. COM-07 live Pilot acceptance.
5. Hardware integration/bench qualification.
6. Live SMS/GSM fallback evidence; continue WhatsApp work in parallel but do not block the interim Telegram Pilot path.
7. BIO EGYPT installation/calibration/commissioning/UAT.
8. Pilot stabilization/fixes.
9. DEV-TRUST-01 -> DEV-TRUST-11 and final commercial protection.
10. Public/commercial signing, final Production Installer, production manuals/presentation/release.

## Evidence rule

Repository/CI success, installer qualification, provider acceptance, hardware validation, field commissioning, UAT and commercial-production readiness are separate gates.

A source merge must never be represented as field acceptance, and an approved architecture must never be represented as implemented capability.


## 16 September 2026 integration update

- SEC-OWNER-01: implementation complete on PR #233; Pilot CI/Windows evidence exists; Production merge/acceptance remains gated by the real manufacturer Ed25519 public keyring, offline private-key commissioning exercise and Production security review.
- Customer ADMIN bootstrap: merged to main in PR #231 and additionally validated in a clean Pilot installation.
- COM-01 through COM-06: source implemented on draft PR #235; COM-07 external/live acceptance remains pending.
- Documentation sync commit on the integration branch records the 16 September Pilot Admin/Installer validation without storing any credential secret.
- BIO EGYPT remains NOT COMMISSIONED / NOT ACCEPTED.


## 18 October 2026 — SD replay and central battery

Controller source moves to `0.1.0-pilot.6` with SD buffering/replay and original acquisition time.
See [SD replay](docs/current/SD-OFFLINE-REPLAY.md) and [one Main battery for four SIMs](docs/hardware/MAIN-CENTRAL-BATTERY-AND-SD-2026-10-18.md).
Backend and controller must be updated together. Physical SD/UPS tests and battery sizing remain open.
