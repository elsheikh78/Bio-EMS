# BIO-EMS Project State

**State date:** 9 September 2026

**Latest published source release:** `v0.20.0` (tag target `e50593ddfda7acd3996d11d1de53c86821cb6c83`)

**Current source-software version:** `0.20.0`

**Current phase:** **SOURCE RELEASE v0.20.0 IS PUBLISHED. LIC-01 THROUGH LIC-13 AND DEP-01-01 THROUGH DEP-01-05 ARE COMPLETE / MERGED / CI VERIFIED. DEP-01-06 SOURCE CORRECTIONS AND AN INTERNAL UNSIGNED WINDOWS 10 BUILD EXIST; CLEAN-MACHINE INSTALLER QUALIFICATION, SIGNING AND PUBLICATION REMAIN OPEN.**

## Current Controlled Continuation

1. Treat GitHub `main` as authoritative and reconcile the local Windows working copy before further implementation.
2. Preserve all P0-P8 closure and evidence boundaries. UI/UX refresh and licensing are new approved scope and must not rewrite historical closure claims.
3. Preserve global Arabic/English localization and RTL navigation correction; baseline `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` remains relevant for UI regression.
4. UX-01 inventory/baseline and recovery of the approved visual-reference masters are complete through PR #162, CI #567 and merge `7a50338c153bf1388d8d28a7f3b2b3658bfd69ac`. UX-02 has now been implemented and verified on its controlled branch using the visual freeze as decision authority.
5. Preserve telemetry-driven refresh/reconnect/fallback behavior for Dashboard and Monitored Areas and apply consistent live behavior to the new Live Board.
6. UX-02 is complete through PR #164, CI #571 and merge `81ea4a9d91c862f31ad7d278914dcb34fa99d5c6`: approved transparent identity variants, shared design tokens/primitives, persisted Light/Dark mode, bilingual theme control and shell adoption. Start UX-03 only from reconciled `main`.
7. UX-03 is complete through PR #165, CI #574 and merge `6a46ad24e49ae219d4ebb8c6e4289856febe6f36`: responsive approved-brand opening composition, bilingual copy, per-tab completion and a no-pre-auth-child-mount boundary. Start UX-04 only from reconciled `main`.
8. UX-04 is complete through PR #166, CI #577 and merge `8f82c4e3a72064bc719c58feec4cf382393efd08`: compact exception-first command surface, condensed KPI/current-reading/priority panels and preserved detailed evidence/live refresh behavior. UX-05 is next and remains responsible for the dedicated Monitoring Areas Live Board route and final Dashboard retargeting.
9. UX-05 is complete through PR #167, CI #580 and merge `e989a516e6ab0f6566eb265aa623b4295ebc8404`: protected bilingual route, trusted room-status cards, Normal/Warning/Alarm/Offline summaries, local filters/density, Dashboard/navigation entry and preserved polling/SSE behavior. Unsupported ranges, min/max and trends remain omitted rather than fabricated. Start UX-06 only from reconciled `main`.
10. UX-06 is complete through PR #168, CI #583 and merge `b05181e0e89f8b3c97d24daac3a643d5f4be0c55`: high-frequency Alarm, Monitored Area, Device and Notification Delivery surfaces now use compact responsive summaries and RTL-safe operational cues; Configuration, Calibration, recipient/escalation and Reporting Center surfaces were reviewed and retained where already aligned. UX-07 is next.
11. UX-07 is complete through PR #169, CI #586 and merge `92449009e726d36b630179178cbd80d32db258ea`: the permission-filtered workspace, Commissioning readiness/acceptance, customer user administration and access/error surfaces are reconciled with responsive, bilingual and accessible shared-theme behavior. UX-08 is next.
12. UX-08 is complete through PR #170, CI #589 and merge `adce8acca13cfb2e82467c39ed5f6dbb4d7567af`: isolated SYSTEM_OWNER login/console, customer fleet, commercial tables and P8 installation lifecycle surfaces are visually reconciled with explicit operational states and responsive behavior. Platform authentication, tenant/RBAC and installation/receipt/technical/customer acceptance boundaries remain unchanged. UX-09 is next.
13. UX-09 is complete through PR #171, CI #592 and merge `eaa8a99bd2acf1b283c280eec4d54b09f789cd2f`: Backend 106 files/755 tests and Frontend 51 files/292 tests pass with typecheck/build/lint/format gates. Source release `v0.20.0` was prepared through PR #172 / CI #594 and published from tag target `e50593ddfda7acd3996d11d1de53c86821cb6c83` after explicit Owner approval.
14. Do not invent a second Monitored Area backend domain. The controlled domain remains `Site -> Monitored Area (Room) -> Sensor`.
15. Preserve passed Email and Telegram live end-to-end Alarm-delivery evidence recorded on 9 September 2026. Meta WhatsApp remains externally blocked; SMS live evidence remains open.
16. DEP-01 Full Offline Windows Installer remains approved later scope and is not yet implemented/qualified.
17. Site-Bound Licensing / Anti-Cloning is now an approved mandatory production gate. Architecture authority: `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.
18. LIC-01 through LIC-13 must be implemented and evidenced before DEP-01 can be declared the final Production Installer and before any commercial/customer production deployment is declared production-ready.
19. Development, laboratory, UI/UAT and explicitly non-production pilot work may continue before the licensing gate where appropriate.
20. Licensing design must preserve monitoring continuity: loss of Internet alone must not unexpectedly stop permitted local telemetry/alarm operation.
21. Keep live-provider, hardware qualification, licensing qualification, installer qualification, production deployment, field Commissioning/UAT and customer acceptance as separate evidence tracks.
22. The 8 September 2026 installer/UI evidence and exact morning continuation are recorded in `docs/project-management/END-OF-DAY-HANDOFF-2026-09-08.md`.
23. Preserve the five-second opening boundary, default dark monitoring mode, corrected Arabic RTL content offset/timestamps, trusted Live Board controls, rolling 24-hour telemetry evidence and persisted local view preferences merged through PR #190 / CI #657 / `92040dfeacefb426e2446abddebdc528c69c3c35`.
24. Do not execute Fresh Install over a workstation with an unrelated Mosquitto service. PR #183 makes this collision fail closed; qualification must use an isolated clean Windows target.

## Implemented Software Position

- P0-P7 software/product closure remains valid.
- P8-01 WhatsApp/Email source delivery is complete; Email live end-to-end evidence passed on 9 September 2026; WhatsApp live evidence remains blocked by Meta.
- P8-01A Telegram source delivery is complete/merged/CI verified; live bot and end-to-end Critical Alarm delivery evidence passed on 9 September 2026.
- P8-02 through P8-08 SYSTEM_OWNER installation provisioning/RBAC source work is complete/merged/CI verified.
- Global customer and SYSTEM_OWNER Arabic/English localization is complete/merged/CI verified.
- RTL navigation drawer correction is merged on `main` at `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- React Dashboard and Monitored Areas already have authenticated telemetry-driven refresh, reconnect/cleanup and polling fallback; these are non-regression requirements for the refresh.
- Site-Bound Licensing LIC-01: **COMPLETE / MERGED / CI VERIFIED** through PR #173, CI #597 and merge `90fe361e71f8a4fb79295e0c95344913b66cba35`.
- Site-Bound Licensing LIC-02 through LIC-06: **COMPLETE / MERGED / CI VERIFIED** through PR #174, CI #600 and merge `43ffcd54c191c59f3aa0f4b34e19c54cd4678bf7` (Backend 110 files / 765 tests).
- Site-Bound Licensing LIC-07 through LIC-10: **COMPLETE / MERGED / CI VERIFIED** through PR #175, CI #603 and merge `39bb230bbef7217a81073d9d8d39933ea46c3ada`. Backend 111 files / 769 tests and Frontend 51 files / 292 tests pass; total 162 files / 1,061 tests.
- Site-Bound Licensing LIC-11 through LIC-13: **COMPLETE / MERGED / CI VERIFIED** through PR #176, CI #606 and merge `ca6f40eba9b22a03318fa8e141d14d8bbc5da09d`. Backend 112 files / 781 tests and Frontend 51 files / 292 tests pass; total 163 files / 1,073 tests. DEP-01 clean-machine installer qualification remains separate.
- DEP-01 final Production Installer: **NOT YET IMPLEMENTED / NOT YET QUALIFIED**.
- DEP-01-01 installer foundation: **COMPLETE / MERGED / CI VERIFIED** through PR #177, CI #609 and merge `d1c5e4dfaee675573d3b7f76c7d279cc8b744f90`. Windows 11 Pro x64/Inno Setup 6 baseline, exact six-input inventory and fail-closed staging integrity/secret checks pass. Backend 113 files / 785 tests and Frontend 51 files / 292 tests pass; total 164 files / 1,077 tests.
- DEP-01-02 input freeze/build source: **COMPLETE / MERGED / CI VERIFIED** through PR #178, CI #612 and merge `cb45456fe2a53c286cd101f79d428312eaf13847`. Exact vendor versions and SHA-256 values, deterministic staging, pinned Inno Setup 6.7.3 compilation and build-evidence generation are implemented. Backend 113 files / 789 tests and Frontend 51 files / 292 tests pass; total 164 files / 1,081 tests. Service lifecycle, Setup execution and clean-machine qualification remain open.
- DEP-01-03 protected configuration/services: **COMPLETE / MERGED / CI VERIFIED** through PR #179, CI #615 and merge `0d5a4527ab69fa4972f9c2b0a7dc09464e422804`. Three isolated virtual service identities, runtime-generated ACL-protected configuration, local MQTT/InfluxDB initialization and LIC-11 execution under the final Backend identity are implemented at source level. Backend 113 files / 793 tests and Frontend 51 files / 292 tests pass; total 164 files / 1,085 tests. Windows execution and qualification remain open.
- DEP-01-04 HTTPS/firewall/health: **COMPLETE / MERGED / CI VERIFIED** through PR #180, CI #618 and merge `07c57f2744e75678f572e0450e295877031b5749`. Installer-generated local TLS, combined frontend/API HTTPS on 443, a Domain/Private LocalSubnet Firewall rule and secret-free post-install component health evidence are implemented at source level. Backend 113 files / 796 tests and Frontend 51 files / 292 tests pass; total 164 files / 1,088 tests. Windows execution and qualification remain open.
- DEP-01-05 lifecycle recovery: **COMPLETE / MERGED / CI VERIFIED** through PR #181, CI #621 and merge `dbb5595ec0c6e0ec8a7b20daa1bddda5a8463ad6`. Verified pre-update application/data/licensing backup, health-gated restore and retained-data Uninstall are implemented at source level. Backend 113 files / 799 tests and Frontend 51 files / 292 tests pass; total 164 files / 1,091 tests. Windows execution and qualification remain open.
- DEP-01-06 internal build preparation: **PARTIAL WINDOWS EVIDENCE / NOT QUALIFIED**. The single-EXE embedded archive correction passed PR #182 / CI #624 / merge `d0b4806197d90fb4fa3d2bd26ebb05afa65efa4a`. Mosquitto collision protection passed PR #183 / CI #627 / merge `c4f19879338090f8887ba18371367ad3f19cf9e1`. Deterministic staging, source validation and Inno Setup 6.7.3 compilation produced an unsigned internal Windows 10 x64 artifact; clean-machine execution, service/HTTPS/reboot/recovery/uninstall evidence, signing and release publication remain open.
- Email and Telegram live Alarm delivery: **END-TO-END EVIDENCE PASSED 9 SEPTEMBER 2026**. The controlled MQTT -> telemetry acceptance -> InfluxDB write -> Critical Alarm -> Site-scoped escalation -> durable Email/Telegram delivery path completed successfully with both providers SENT on attempt 1/5 and actual receipt confirmed. Evidence: `docs/project-management/EMAIL-TELEGRAM-END-TO-END-EVIDENCE-2026-09-09.md`.
- Post-v0.20.0 UI/operations continuation: **MERGED / CI VERIFIED THROUGH PR #190**. RTL/timestamps, dark theme, five-second opening, Live Board controls, configured evidence, rolling 24-hour telemetry trends and persisted view preferences are on `main` through `92040dfeacefb426e2446abddebdc528c69c3c35`. Visual screenshot acceptance remains separate.

## Approved UI/UX Refresh Scope — UX-01 through UX-09 Complete

Controlled work package:
`docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`

Detailed visual decision freeze:
`docs/project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md`

Approved scope includes selected BIO-EMS logo option 5 and production variants, Light/default and optional Dark monitoring theme, coherent shared surfaces/backgrounds, professional opening experience, compact operational Dashboard, Monitoring Areas Live Board, full customer/SYSTEM_OWNER/P8 visual reconciliation, Arabic/English RTL/LTR regression, responsive/accessibility review and preservation of API/RBAC/tenant/alarm/audit/reporting/commissioning semantics.

This scope must not be marked complete until code is implemented, repository gates pass, PR/CI evidence exists and merge evidence is recorded.

## Mandatory Site-Bound Licensing Production Gate — Source Gate Complete

**Architecture:** `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`

Approved protection objective: prevent a licensed BIO-EMS installation from being copied/reused on another computer, another customer site, or another site belonging to the same customer without separately authorized licensing.

Approved trust chain:

`Customer -> Licensed Site -> Installation -> Host Identity -> Authorized Gateways/Devices -> Signed License`

Required work packages:

- LIC-01 Licensing domain/data model
- LIC-02 Installation identity/protected key storage
- LIC-03 Hardware fingerprint/tolerance
- LIC-04 Signed license certificate/signing/verification
- LIC-05 Activation API/Platform Owner workflow
- LIC-06 Local runtime validator
- LIC-07 Site/gateway/device binding
- LIC-08 Offline activation/grace/monitoring continuity
- LIC-09 Transfer/reactivation/revocation
- LIC-10 Platform licensing dashboard/audit
- LIC-11 Installer integration
- LIC-12 Anti-tamper/negative/security qualification
- LIC-13 Signing-key operations/backup/recovery

**Gate:** no final Production Installer and no commercial/customer production-ready declaration until LIC-01 -> LIC-13 have real implementation and test evidence.

## Release / Version Position

`VERSION` is the source-version authority at `0.20.0`; published tag `v0.20.0` points to `e50593ddfda7acd3996d11d1de53c86821cb6c83`. Later licensing work remains unreleased until a future controlled version decision.

## External Evidence Still Open

Physical controller/hardware qualification, live SMS evidence, WhatsApp provider acceptance, deployed MQTT/recovery evidence, endurance, production backup/restore/rollback/DR execution, BIO EGYPT physical installation/calibration/commissioning, Windows installer licensing integration/clean-machine qualification, final installer qualification, customer UAT/Quality sign-off and production/customer acceptance remain separate gates unless actual evidence is recorded.

## Next-Session Start Point

1. Reconcile the local Windows working copy with GitHub `main`; confirm clean status and matching local/remote SHAs.
2. Read `docs/project-management/END-OF-DAY-HANDOFF-2026-09-08.md`, this file and `IMPLEMENTATION_PLAN.md`.
3. Preserve the current development workstation and its unrelated Mosquitto service; use an isolated clean Windows 10/11 x64 target for installer qualification.
4. Verify the unsigned internal Setup SHA-256, then execute Fresh Install and capture service, port, HTTPS/API health and secret-free licensing-receipt evidence.
5. Reboot and verify recovery; then test Repair/Upgrade rollback and retained-data Uninstall.
6. Review newly merged customer/SYSTEM_OWNER UI in Arabic/English and light/dark modes, capture screenshots and open focused fixes for actual defects.
7. Keep signing, a future version/release, licensing qualification, provider/hardware/field/UAT/customer acceptance as explicit later decisions and distinct evidence gates.