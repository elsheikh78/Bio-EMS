# BIO-EMS Changelog

## Unreleased — security phase two

- Add revocable hashed company sessions with additive D1 migration 0003, server-side logout, key-rotation binding and expired-session cleanup. Legacy cookies require re-login; migration precedes Worker deployment.
- Upgrade Vitest/coverage tooling to 5.0.5 and cloud dev tools within supported majors. Preserve existing test assertions and mock-clear behavior; fix constructor/callable/lifecycle fixtures and exclude compiled test duplicates by source scope.
- Backend/frontend/company-cloud all-dependency npm scans report zero candidate entries; no mobile/vendor clean-security claim or remote deployment.
- Record Main TLS DNS/IP SAN mismatch and the controlled remediation work package without disabling trust or changing live certificates.


## Unreleased — runtime dependency advisory remediation

- Update backend/frontend affected locked dependency chains; production npm audit reports zero affected package entries in both candidate trees. Development/tooling and other-component findings remain open.
- Deliberately upgrade Nodemailer 9 to10.2.1 with installed-library RFC message regression; retain real SMTP/TLS delivery acceptance as a separate gate. No force upgrade or binary release.

## Unreleased — customer authentication audit remediation

- Bound customer login attempts to ten/IP/minute with Retry-After and bounded no-eviction limiter shared with the independently counted owner login path.
- Derive customer access-token signing keys from current credential material and JWT secret; own/admin/offline password replacement rejects older tokens. Prevent issuance against a stale password-verification snapshot.
- Add fresh session fields to successful own-password-change response and update frontend to validate/store the replacement token/expiry.
- Compatibility: initial upgrade invalidates old customer tokens; deploy backend/frontend together. No schema migration or published release. Restore/re-enable limits are documented in ADR-024. Other audit findings remain open.


## Unreleased —28 October2026 documentation/code audit

- Preserve309 original text documents with SHA-256 baseline manifest and immutable history; classify active specs/ADRs and historical work.
- Refresh authoritative project state, navigation, component guides and operating/testing/security/recovery/acceptance documentation.
- Record1551 successful routine tests, two security probes and C host checks; preserve dependency advisory evidence and open auth/TLS/session/acceptance findings.
- Add archive-integrity/local-document-link verification. No application/firmware/database/dependency behavior, version, release or deployment change.

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<docs/README.md>) describes the reviewed source baseline; [Project state](<PROJECT_STATE.md>) controls current status. [Original pre-audit document](<docs/archive/2026-10-28-pre-audit/CHANGELOG.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


### 26 October 2026 — QC flashing, customer monitor and documentation reconciliation

- #308 merged offline QC flashing for ESP32-S3 and both Nano bootloaders in standalone Tester 0.3.0, with package hash checks, tool verification, runtime identity and retained flash evidence. Operating firmware restoration remains separate.
- #306 merged the native customer monitor and isolated bearer Viewer API. Matching Worker deployment, signed distribution and physical-device acceptance remain separate; native remote push/background monitoring is not implemented.
- #301 merged dated 19 October hardware inventory/preparation evidence.
- Reconcile current state, execution, scope, risks, navigation and operating references to [26 October checkpoint](docs/current/PROJECT-CHECKPOINT-2026-10-26.md). Record open #309 / proposed Tester 0.4.0 integrated four-probe scope separately from merged source; successful CI does not grant physical acceptance.
- Documentation does not change platform `0.20.0`, operating firmware versions, existing packages or cloud deployments. Earlier dated entries retain their historical scope.

### 22 October 2026 — company Android/iOS app (PR #307)

- Add the independent `company-mobile/` Expo / React Native company administration shell, original logo and restricted WebView for the deployed Arabic/English company portal and selected-site System Owner.
- Preserve existing company sessions, owner authentication/MFA and destructive-action confirmations. Add confirmed native navigation, recovery controls and exact-origin URL validation; no embedded company credentials or new backend API.
- Add Android/iOS source generation and Hermes export checks, plus an isolated arm64 Android QA APK build and signature/package verification. The user reported successful Android application operation on 22 October; detailed feature acceptance remains unrecorded.
- Document installation, authentication, limitations, build provenance, APK checksum and pending iOS signing/distribution. This QA app is version `0.1.0`; platform source version remains `0.20.0`. No Client Setup, Manufacturer Tools, firmware, cloud deployment or database migration is required for this change.

### 20 October 2026 — unified pilot.7 assembly release

- Add DS3231 UTC retention and explicit SIM800L bench diagnostics/SMS commands; preserve RS485, SD and Ethernet pin assignments.
- Read installer firmware identity from the version header, with a Windows regression test for future version changes and duplicate definitions.
- Add Hardware Tester 0.2.0 source/build workflow, frozen Rev B assembly criteria, RTC evidence and bounded USB operational diagnostic capture. Sensor-only QC firmware remains isolated and must be restored to operational firmware afterwards.
- Publish numbered terminal schedules and Main/SIM mounting reference. Physical qualification remains separate from software/build checks.


### 18 October 2026 — pending SD replay / central battery change

- Add checksum-protected bounded Main SD queue; retry original timestamped readings as REPLAY and preserve failed/corrupt records.
- Require actual pipeline acceptance before HTTP acknowledgement; replay does not evaluate live alarms.
- Add local-platform clock synchronization and explicit storage/time diagnostics.
- Bump ESP32 firmware and installer gates to `0.1.0-pilot.6`; Nano firmware is unchanged.
- Document one central Main battery/charger/UPS supplying four SIM-D4 modules and sixteen probes; capacity and physical qualification pending.
- Details: [SD replay](docs/current/SD-OFFLINE-REPLAY.md), [central backup and wiring](docs/hardware/MAIN-CENTRAL-BATTERY-AND-SD-2026-10-18.md).

### 15 October 2026 company customer and activity management

- Add customer removal with name confirmation, linked-site guard and transactional
  Viewer access cleanup. Audit customer deletion independently.
- Show five activity events initially, load older pages with stable cursors, and
  preview/confirm deletion by device-local calendar dates. Keep a deletion event.
  This selects manual retention instead of weekly archives. Cloud redeployment
  required; no Client Setup, migration, firmware or version changes.


### 14 October 2026 existing company connection settings

- Existing System Owner connections can enable Viewer export or change remote-control
  settings without re-entering the saved encrypted token. Token reuse requires the
  same site ID and company origin; new or changed targets still require a token.

### 14 October 2026 customer Viewer cloud/PWA deployment

- Added Arabic/English responsive read-only customer monitoring across sites/rooms,
  telemetry timestamps, explicit stale/offline states, alarm feed and browser sound.
- Added customer-scoped Viewer credentials, revocable sessions, company account UI,
  opt-in installed-site-only export, D1 snapshots and encrypted Web Push retry jobs.
- Added installable PWA shell/icons and a scoped service worker caching public assets
  only. PR #296 was merged and the Worker/D1/VAPID deployment completed; live
  HTML and unauthenticated API checks passed. PR #297 preserves the saved encrypted
  token for existing connection settings and passed Windows setup/health/update CI.
  Customer telemetry and real-phone Push acceptance remain pending; native store
  apps are not built. Version unchanged.

### 11 October 2026 company cloud pilot source candidate

- Added a separate Cloudflare Workers/D1 company portal for customers, enrolled
  installations, device/alarm count summaries, site license tracking and audit.
- Added opt-in local System Owner connection configuration and end-to-end encrypted
  remote owner transport preserving local credentials, MFA and route validation.
  SQLite migration 034 stores encrypted connection data and one-time command receipts.
- Added deployment/operating guidance and CI gates. Central license records remain
  monitor-only; local signed certificates, large file transfer, live account deployment
  and installed Windows qualification are separate. Firmware/version unchanged.

### 11 October 2026 offline ADMIN signed password recovery

- Added client request export, company-signed permit verification and restricted password entry without issuing an authenticated session. Requests expire in 24 hours; signed permits last at most 60 minutes and grants at most 10 minutes, with installation/account/challenge binding and atomic one-time consumption.
- Added standalone Manufacturer Tools ADMIN recovery signer, encrypted Ed25519 key generation/public trust export, and elevated client public-trust installation. Signing keys are independent and never shipped in Setup; field use requires company key provisioning.
- Added SQLite migration 033, domain/UI/issuer tests and an installed Windows round-trip test. Existing direct System Owner reset remains available.

### 11 October 2026 ADMIN password recovery guidance

- Split public password recovery guidance into customer ADMIN company/System Owner support and Operator/Viewer request paths, in Arabic and English. ADMIN guidance submits no request and promises no automatic reset link; generic recovery responses now clarify eligibility.
- Added UI regression tests and wait for initial heading focus before simulated login typing to avoid the observed test focus race.

### 11 October 2026 installation identity records

- Added Arabic/English copy and JSON export controls to the System Owner installation identity section for company customer records. Exports use the host UUID and contain only customer/site identifiers and names, with no provisioning secrets.
- Documented the distinction between host identity, configuration lifecycle identity and common signed client updates.
- Added the Arabic customer-record/signing operating guide and synchronized current documentation navigation and state with PR #290 (`70108f0`). Main CI `38126214712` and Windows build `38126214721` passed; this documentation change does not create a new release.

## [Unreleased]

### Automatic company ADMIN recovery trust in Client Setup

- Validate and bundle the company's exported Ed25519 public recovery keyring; reject
  private keys, oversized files, duplicate IDs and keyrings without an active key.
- Deploy approved public trust automatically during fresh install and Repair/update.
  Customer password recovery uses only the client login interface.
- Add manifest provenance and Windows deployment verification. Production requires public
  recovery trust; Pilot builds without it do not claim field recovery readiness.
- Company private keys stay in Manufacturer Tools custody; no private key is generated by CI.

### 10 October 2026 Pilot network and client update integration

- Merged PR #288: Wi-Fi/W5500 DHCP choice for new controller commissioning and
  controller firmware `0.1.0-pilot.5`; SIM-D4 remains `0.1.0-bench.2`.
- Added ADMIN signed Client Setup EXE staging/review/install with persistent update
  results and independent worker dispatch. Cloud download remains disabled by default.
- Fixed Base64/legacy-hex Provisioner token compatibility, protected update-jobs
  initialization during Repair, and original PostUpdate failure diagnostics.
- Main Windows run `38078138666` passed install, backup/restore, update/Repair,
  token/identity preservation, ACL migration and tamper rejection. Other main gates passed.
- Manufacturer Tools behavior is unchanged. Product version stays `0.20.0`;
  this entry does not amend the historical v0.20.0 release or claim physical acceptance.
- Reconciled README, current indexes, project state, operations and release process;
  exact build provenance is in `docs/current/PILOT-BUILD-NOTES-2026-10-10.md`.


### 30 September 2026 documentation reconciliation

- Separated 72 dated closure/audit/acceptance records into `docs/archive/`, added current documentation navigation, and updated links and the required-document manifest path. Architectural decisions and active specifications retain their domain folders.

- Reconciled state, execution plan, Arabic guide, backend/frontend guidance, architecture, persistence, Windows operations, risks and Pilot scope against `main@6efd78a`.
- Documented merged Builder/USB provisioning separately from missing MAIN-16/SIM-D4 acquisition, threshold authoring and ADMIN topology-policy gaps.
- Added a complete documentation inventory with current-authority and historical-evidence boundaries; preserved dated release and acceptance claims.
- No source-version bump, new Setup/firmware binary, physical acceptance or new published release is claimed.


### 16 September 2026 Pilot validation and integration reconciliation

- Recorded successful clean Pilot Setup validation from the current integration line, including the three BIO-EMS Windows services and successful customer ADMIN login.
- Recorded that Customer ADMIN provisioning is merged to main through PR #231.
- Recorded SEC-OWNER-01 as source implemented on PR #233 while Production acceptance remains gated by the real manufacturer Ed25519 key ceremony and offline commissioning evidence.
- Recorded COM-01 through COM-06 as source implemented on draft PR #235 with passing CI/Internal Windows Setup gates; COM-07 live acceptance remains open.
- Preserved product version `0.20.0`; this documentation reconciliation does not publish a new release.


### 11 September 2026 audit reconciliation

- Added the authoritative complete audit and Pilot-first execution order.
- Reconciled current status through PR #205 and installer progress through PRs #199-#203.
- Defined COM-01 through COM-07 as the immediate notification-administration work package.
- Defined the next execution order as COM source -> fresh Pilot Setup -> multi-machine installer qualification -> hardware bench qualification -> field commissioning/UAT -> Pilot stabilization -> deferred production-grade Device Trust/commercial protection.
- Added a populated `PILOT_SCOPE.md` and `RISK_REGISTER.md`.
- Replaced stale/corrupted README status content and corrected the installer position.
- Preserved source version `0.20.0`; this audit does not create a new release.

### Added / Changed

- Corrected the offline Windows Setup to compile the four archive payloads into one executable and added a fail-closed preflight that protects an unrelated pre-existing Mosquitto service. An unsigned internal Windows 10 x64 build passed deterministic staging, source validation and Inno Setup compilation; clean-machine qualification and signing remain open.
- Strengthened the post-v0.20.0 monitoring experience with corrected Arabic RTL content/timestamps, default dark monitoring theme, a five-second opening boundary, richer trusted Live Board controls/evidence, rolling 24-hour temperature min/max/trends and persisted local view preferences. Visual screenshot acceptance remains open.

- Completed the LIC-01 domain foundation and implemented the LIC-02 through LIC-06 licensing core: protected installation identity, tolerant composite hardware binding, Ed25519 certificates, SYSTEM_OWNER activation workflow and offline local runtime validation.
- Added migrations 022/023, immutable certificate storage, append-only licensing evidence, module/device/sensor entitlements and explicit monitoring-continuity decisions for invalid licenses.
- Implemented LIC-07 through LIC-10: same-Site device authorization, offline validation/grace evidence, audited revoke/transfer lifecycle, and a bilingual SYSTEM_OWNER licensing-governance summary with recent audit history.
- Implemented LIC-11 through LIC-13 source protection: create-only installer identity provisioning, anti-copy/tamper negative qualification, and controlled signing-key generation/rotation/backup/recovery operations. DEP-01 clean-machine installer qualification remains separate.
- Started DEP-01 with a Windows 11 x64/Inno Setup package contract and a fail-closed staged-payload validator covering the exact application/runtime inventory, SHA-256 integrity, redistribution evidence and forbidden secret/identity payloads.
- Implemented DEP-01-02 source: exact Node.js/Mosquitto/InfluxDB/WinSW input locks, checksum-enforcing acquisition, deterministic application staging, pinned commercial Inno Setup build gate, initial Setup source and hash-based build evidence. Setup execution and clean-machine qualification remain open.
- Implemented DEP-01-03 source for isolated Windows virtual service identities, runtime-generated protected configuration, authenticated local MQTT, local InfluxDB onboarding and LIC-11 first-start provisioning under the final Backend DPAPI identity. Windows execution and installer qualification remain open.
- Implemented DEP-01-04 source for a certificate-backed HTTPS front-door on port 443, LocalSubnet-scoped Domain/Private Firewall access, integrated frontend delivery and secret-free post-install component health evidence.
- Implemented DEP-01-05 source for verified pre-update backup, health-gated Repair/Upgrade rollback and retained-data Uninstall with explicit lifecycle evidence.

## [0.20.0] - 2026-09-07

### Release scope

Backward-compatible product experience milestone completing the approved BIO-EMS UI/UX refresh and Telegram source extension after the `v0.19.0` source milestone.

### Added / Changed

- Added the approved BIO-EMS identity assets, shared Light/Dark design system and responsive bilingual opening experience.
- Reworked Dashboard into a compact exception-first operational surface and added the protected Live Monitoring Wall with one trusted status card per Monitored Area.
- Reconciled Monitored Areas, Alarms, Devices, Configuration, Calibration, Notification Delivery, Reporting Center, Users/Audit and Commissioning with responsive RTL/LTR behavior.
- Reconciled isolated SYSTEM_OWNER customer, license/update/service and P8 installation lifecycle workflows without changing platform/customer authentication boundaries.
- Added Telegram Bot API as an independent Alarm-delivery channel while Meta WhatsApp onboarding remains blocked.
- Extended recipient endpoints, escalation policies, durable delivery records, Delivery Operations contracts, and configuration UI with explicit `TELEGRAM` identity.
- Added migration 021, secret-safe Bot Token configuration, provider tests, and `npm run test:telegram-delivery` for controlled live evidence.
- Preserved WhatsApp for later activation and retained SMS as the emergency/fallback channel; no live Telegram or end-to-end acceptance is claimed yet.
- Completed full Backend and Frontend regression: 157 test files and 1,047 tests, with typecheck, builds, lint and formatting passing.

### Verification boundary

This published source release does not claim live WhatsApp acceptance, Telegram end-to-end acceptance, hardware qualification, Site-Bound Licensing implementation, final Windows Installer qualification, production deployment, field commissioning, BIO EGYPT UAT, Quality sign-off or customer acceptance.

## [0.19.0] - 2026-09-03

### Release scope

Product-surface milestone completing P7 and P8 source delivery, global Arabic/English customer and SYSTEM_OWNER localization, and the first controlled live Email acceptance evidence for P8-01.

### Added / Changed

- Completed the global language switch with persisted selection and full RTL/LTR theme and document direction.
- Replaced the partial P8-only Arabic coverage with built-in Arabic resources and translated customer navigation, headers, monitoring, Alarm, Device, delivery, calibration, reporting, configuration, User/Audit and Workspace surfaces.
- Made report Preview/CSV/PDF requests follow the selected interface language instead of always requesting English.
- Confirmed the controlled Gmail SMTP smoke test returned `SENT` and the recipient independently confirmed inbox arrival on 3 September 2026; no credential or recipient address is stored in Git.
- Kept P8-01 WhatsApp and end-to-end dual-channel acceptance open because Meta developer registration still loops after Email verification.

### Verification boundary

Automated frontend checks cover built-in Arabic resource selection, Arabic customer calibration rendering, RTL direction, language persistence, and the existing application regressions. Email evidence does not imply WhatsApp delivery, field commissioning, customer UAT, or production acceptance.

- Completed P8-02 through P8-08 source implementation through PR #152 / CI run #537 / merge `0666dd2bbf837c80cf52542062cf7cdd9a337907`: explicit customer ownership, customer-RBAC realignment, SYSTEM_OWNER ADMIN lifecycle, controlled installation revisions, exact controller receipts, separated technical/customer acceptance, and bilingual workflows.
- Kept P8-01 live Email/WhatsApp and end-to-end Alarm acceptance as an explicit open evidence track while allowing the independently approved P8-02 through P8-08 source implementation to proceed.

- Added a secret-safe SMTP configuration template and controlled email-delivery smoke-test command for local/live provider validation.
- Closed P8-01 source integration through PR #147 / CI run #526 / merge `17bbfc1d5623ad7bdf47d99e6d5954fc33a9666d` and its safe setup follow-up through PR #148 / CI run #528 / merge `a045e933dcd6583f1e7e32e73562f0ab2b45dd4c`; live WhatsApp and end-to-end evidence remain open.

- Added Meta WhatsApp Cloud API and authenticated SMTP Email providers as primary Alarm delivery channels using the existing durable queue, retry, recipient, escalation, and evidence boundaries.
- Preserved SMS as the emergency/fallback channel and documented the recommended `WHATSAPP + EMAIL` first escalation step followed by SMS.
- Prepared source version `0.19.0` for controlled tag and GitHub Release publication; live WhatsApp provider/template and end-to-end evidence remain open.

- Implemented P7-03 through P7-05 owner-facing license/binding, update-entitlement, and maintenance/calibration/support operations with bilingual states and authenticated append-only mutation provenance.
- Added controlled license and service-record update contracts while preserving the isolated SYSTEM_OWNER backend boundary and explicit physical-installation, payment, OTA-execution, and field-evidence distinctions.
- Completed P7-06 cleanup by removing the unused Sprint-14 Foundation placeholder and obsolete deferred-product text.
- Closed P7-03 through P7-08 through PR #145 / CI run #522 / merge `3798277bea14820632c8e1edd0b83df91f8f7084`; the approved software scope is SOFTWARE PRODUCT COMPLETE while external evidence gates remain separate.

### Added / Changed

- Added an isolated SYSTEM_OWNER frontend authentication/session boundary using the existing platform-auth backend contract.
- Added protected `/system-owner` login/console routes with strict SYSTEM_OWNER principal validation and fail-closed route behavior.
- Added a bilingual SYSTEM_OWNER console shell for the remaining P7 commercial product modules without exposing owner navigation to customer roles.
- Added frontend authorization/contract regression coverage for the owner trust boundary.
- Added SYSTEM_OWNER customer fleet list/detail routes and customer creation over the existing P5 platform-operations contract.
- Added existing Site/installation context derived only from recorded commercial license/service bindings, with customer creation provenance and append-only commercial-event metadata.
- Added owner-session query isolation/cache clearing and bilingual loading/error/empty/detail/create states for the P7-02 fleet workflow.
- Closed P7-02 through PR #142, final CI run #516 / workflow `33543271797`, and merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`.

### Boundary

P7-01 and P7-02 do not implement billing/payment, invoicing, live remote update execution, physical installation, field commissioning, provider delivery, customer UAT, Quality sign-off, or production/customer acceptance. P7-02 also does not expose unsupported customer lifecycle update mutations.

## [0.18.0] - 2026-09-01

### Release scope

Source-software milestone completing the P3 commissioning tooling, P4 production-hardening controls, P5 isolated commercial operations, and P6 controlled productization package.

### Added / Changed

- Added Site-scoped commissioning sessions, evidence, deviations, acceptance decisions, readiness UI, and controlled CSV/PDF records.
- Added deployment-readiness validation for separated backups, retention, logging, and graceful shutdown.
- Added SYSTEM_OWNER-only customer, license/update-entitlement, and maintenance oversight records with append-only provenance.
- Reconciled the product version and backend package metadata and added a machine-checkable controlled release manifest.

### Acceptance boundary

Automated software completion does not claim production deployment, physical qualification, live-provider delivery, field commissioning/endurance, BIO EGYPT UAT, customer sign-off, or production acceptance. Those evidence gates remain open until actually performed.

## [0.17.0] - 2026-08-31

### Release scope

Source-software milestone consolidating the substantial post-`v0.15.0` work through P0/P1/P2 software closure. This is a MINOR SemVer increment because it contains significant new functionality, not merely fixes.

### Added / Changed

- Completed the controlled Reporting Center with Calibration History, Temperature Performance, Alarm History, Device Communication Health, and Audit and Operations in Preview/CSV/PDF workflows.
- Added authenticated telemetry-driven Dashboard and Monitored Areas refresh with reconnect, cleanup, and polling fallback.
- Completed the P1 Notification Delivery Engine software sequence, including durable notification events/delivery operations and controlled provider/runtime boundaries.
- Completed P2-01 through P2-09 Site Controller host-side software runtime: deterministic runtime/watchdog state, BF-08 configuration receipt/integrity, DS18B20 acquisition abstraction, offline Alarm evaluation, emergency SMS failover, reconnect reconciliation, controller health evidence, and bench qualification gating.
- Hardened P2 after qualification review by persisting/revalidating the complete known-good BF-08 envelope and making replay acceptance durable across restart with same-batch duplicate suppression.
- Established `PROJECT_STATE.md` as the single current-state authority, converted `docs/archive/SPRINT_PROGRESS.md` to a historical ledger, removed duplicate `docs/project-status.md`, and made README the stable project/documentation entry point.
- Preserved the independent hardware validation path: initial test kit first, then HV execution; no hardware approval is inferred from software CI.

### Verification evidence

- BF-10 reporting closure: PR #106 / CI run #303 SUCCESS.
- P1 software sequence: PRs #109 through #113, final integration commit `b1d2611866d2e7a8455d5ed898932ae91fe6068f`, CI run #319 SUCCESS.
- P2 software sequence: PRs #115 through #123; P2-09 CI run #380 SUCCESS.
- P2 durability hardening: PR #124 / CI run #382 SUCCESS / merge commit `453ea1fe6f983528c861667dc638bcc424710eff`.
- Documentation authority and audit handoff: PR #125 / CI run #387 SUCCESS / merge commit `d1918a1bd6526cfd8c140bd350e93e584641436d`.
- Release-preparation PR must pass the normal backend/frontend GitHub quality gates before merge/tag publication.

### Acceptance boundary

This release does **not** claim:

- physical Site Controller qualification;
- live industrial DS18B20 bench acceptance;
- live SIM800L carrier delivery acceptance;
- deployed MQTT endurance/72-hour hardware PASS;
- BIO EGYPT installation or commissioning;
- customer/Quality UAT or production acceptance.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED** until external evidence gates are executed and approved.

## [0.16.3] - 2026-08-31 — Professional reporting baseline

- Applied the BIO-EMS controlled visual identity to Alarm History, Device Communication Health, and Audit and Operations PDF exports.
- Added Site-time-zone rendering, report identity and scope, executive summaries, data-quality disclosure, controlled-copy footers, and page numbering to operational PDFs.
- Closed BF-10 integration verification through PR #106 and successful CI run #303.
- Kept field MQTT endurance, commissioning, and customer UAT as explicit external evidence gates.

## [0.16.2] - 2026-08-31 — Operational report export fix

- Fixed strict client validation rejecting Alarm, Device Health, and Audit CSV/PDF exports before the request reached the backend.
- Hardened browser downloads and added CSV/PDF request-contract and failure-feedback regression coverage.

## [0.16.1] - 2026-08-31 — Reports Center visual completion

- Replaced the calibration-focused readiness table with selectable report cards.
- Made selected report identity, scope, evidence source, availability, and preview update together.

## [0.16.0] - 2026-08-31 — Reporting Center completion

- Completed Alarm History, Device Communication Health, and Audit and Operations reports with validated Preview/CSV/PDF workflows.
- Added an append-only Device communication event ledger and reused existing Alarm/Audit evidence stores.
- Closed BF-10 at the source-software boundary without claiming field commissioning or customer acceptance.

## [0.15.1] - 2026-08-31 — Live monitoring and temperature reporting completion

- Added authenticated SSE publication after accepted/persisted telemetry and Alarm evaluation.
- Added frontend stream lifecycle, Dashboard/Monitored Areas invalidation, reconnect behavior, logout cleanup, and polling resilience fallback.
- Integrated Temperature Performance into Reports Center Preview/CSV/PDF.

---

## [0.15.0] - 2026-08-17

### Release

Post-`v0.13.0` repository development through completed Sprint 14 frontend and Sprint 15 Pilot-readiness foundation.

### Added / Changed

- ADMIN User Management with transactional last-active-ADMIN protection.
- React frontend/AppShell, typed localization, browser authentication/session lifecycle, and authorization-aware routing.
- Operational Dashboard and Site → Monitored Area → Sensor views.
- Product-grade Sensor identity/hardware/installation/current calibration state and append-only calibration history.
- Trusted Device communication-health semantics and durable Alarm/Device notification events.
- Provider-neutral emergency SMS failover policy.
- Controlled BIO EGYPT two-Site/20-Sensor Pilot documents.
- Production configuration validation, MQTT TLS/QoS, persistent SQLite/backup paths, and LIVE/REPLAY recovery semantics.

### Compatibility / boundary

- Existing `/api/v1`, authentication/RBAC, Device lifecycle, and Site → Room → Sensor relationships remain authoritative.
- Frontend private package version is not an independently published BIO-EMS product version.
- Publishing `v0.15.0` did not constitute field commissioning or customer acceptance.

---

## [0.13.0] - 2026-08-11

### Release

Sprint 13 — Centralized Role-Based Authorization and Alarm Acknowledgment Audit.

### Added / Changed

- Centralized permission vocabulary and Role → Permissions authorization policy.
- Route authorization across Site, Room, Sensor, Device, Alarm, and Dashboard APIs.
- Migration 004 for `acknowledged_by_user_id` and authenticated actor audit persistence.
- Atomic Alarm acknowledgment with state-conflict handling and explicit public projection.

### Verified

- Published `v0.13.0` tag targets `ee2cb45832888ff500e02afcbe1418b6144276c6`.
- Automated tests, typecheck, build, lint, formatting, and GitHub Actions passed.

---

## [0.12.0] - 2026-08-10

### Release Candidate

Sprint 12 — Device Onboarding and Telemetry Trust Boundary.

- Added strict Device request/list validation, read/update/lifecycle APIs, Site existence checks, Device/Sensor telemetry trust enforcement, and regression coverage.
- Preserved existing MQTT topic/payload contracts and introduced no SQLite migration in this release candidate.

---

## [0.11.0] - 2026-08-06

### Release

Sprint 11 — Engineering Foundation and Alarm Consolidation.

- Added the unified six-state Alarm Domain Engine, warning thresholds, versioned/idempotent SQLite migration history, and quality tooling.
- MQTT Alarm evaluation and Dashboard room status share the Domain Engine.

---

## [0.10.0] - 2026-08-03

### Release

Sprint 10 — Dashboard foundation.

- Added Dashboard Summary, Latest Telemetry, Room Status, and Alarm Statistics APIs.
- Added Dashboard aggregation and generic Influx telemetry-query foundations.

## Detailed historical evidence

Detailed Sprint, BF, PVR, architecture, Pilot, reporting, and hardware records remain under `docs/` and in immutable Git history. This changelog is the controlled product/source release ledger; it is not a duplicate of `PROJECT_STATE.md`.
