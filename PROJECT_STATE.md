# BIO-EMS Project State

**State date:** 5 September 2026

**Release prepared for publication:** `v0.19.0`

**Current source-software version:** `0.19.0`

**Current phase:** **P8 SOURCE SOFTWARE, GLOBAL LOCALIZATION, P8-01A TELEGRAM EXTENSION, AND RTL NAVIGATION CORRECTION COMPLETE / MERGED. UI/UX UX-01 IS MERGED; UX-02 BRAND AND SHARED DESIGN SYSTEM IS IMPLEMENTED AND VERIFIED ON ITS BRANCH, AWAITING PR MERGE. SITE-BOUND LICENSING REMAINS APPROVED / NOT YET IMPLEMENTED.**

## Current Controlled Continuation

1. Treat GitHub `main` as authoritative and reconcile the local Windows working copy before further implementation.
2. Preserve all P0-P8 closure and evidence boundaries. UI/UX refresh and licensing are new approved scope and must not rewrite historical closure claims.
3. Preserve global Arabic/English localization and RTL navigation correction; baseline `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` remains relevant for UI regression.
4. UX-01 inventory/baseline and recovery of the approved visual-reference masters are complete through PR #162, CI #567 and merge `7a50338c153bf1388d8d28a7f3b2b3658bfd69ac`. UX-02 has now been implemented and verified on its controlled branch using the visual freeze as decision authority.
5. Preserve telemetry-driven refresh/reconnect/fallback behavior for Dashboard and Monitored Areas and apply consistent live behavior to the new Live Board.
6. UX-02 implementation is verified on `agent/ux-02-brand-theme`: approved transparent identity variants, shared design tokens/primitives, persisted Light/Dark mode, bilingual theme control and shell adoption. Do not start UX-03 from this branch until the UX-02 PR is merged and `main` is reconciled.
7. Do not invent a second Monitored Area backend domain. The controlled domain remains `Site -> Monitored Area (Room) -> Sensor`.
8. Preserve passed Email SMTP evidence. Meta WhatsApp remains externally blocked; Telegram live bot/end-to-end evidence remains open unless separately executed and documented.
9. DEP-01 Full Offline Windows Installer remains approved later scope and is not yet implemented/qualified.
10. Site-Bound Licensing / Anti-Cloning is now an approved mandatory production gate. Architecture authority: `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.
11. LIC-01 through LIC-13 must be implemented and evidenced before DEP-01 can be declared the final Production Installer and before any commercial/customer production deployment is declared production-ready.
12. Development, laboratory, UI/UAT and explicitly non-production pilot work may continue before the licensing gate where appropriate.
13. Licensing design must preserve monitoring continuity: loss of Internet alone must not unexpectedly stop permitted local telemetry/alarm operation.
14. Keep live-provider, hardware qualification, licensing qualification, installer qualification, production deployment, field Commissioning/UAT and customer acceptance as separate evidence tracks.

## Implemented Software Position

- P0-P7 software/product closure remains valid.
- P8-01 WhatsApp/Email source delivery is complete; Email live evidence passed; WhatsApp live evidence remains blocked by Meta.
- P8-01A Telegram source delivery is complete/merged/CI verified; live bot and end-to-end evidence remain open.
- P8-02 through P8-08 SYSTEM_OWNER installation provisioning/RBAC source work is complete/merged/CI verified.
- Global customer and SYSTEM_OWNER Arabic/English localization is complete/merged/CI verified.
- RTL navigation drawer correction is merged on `main` at `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- React Dashboard and Monitored Areas already have authenticated telemetry-driven refresh, reconnect/cleanup and polling fallback; these are non-regression requirements for the refresh.
- Site-Bound Licensing LIC-01 through LIC-13: **NOT YET IMPLEMENTED**.
- DEP-01 final Production Installer: **NOT YET IMPLEMENTED / NOT YET QUALIFIED**.

## Approved UI/UX Refresh Scope — UX-01 Complete / UX-02 Branch Complete / UX-03+ Not Yet Implemented

Controlled work package:
`docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`

Detailed visual decision freeze:
`docs/project-management/UI-UX-VISUAL-DESIGN-FREEZE-2026-09-04.md`

Approved scope includes selected BIO-EMS logo option 5 and production variants, Light/default and optional Dark monitoring theme, coherent shared surfaces/backgrounds, professional opening experience, compact operational Dashboard, Monitoring Areas Live Board, full customer/SYSTEM_OWNER/P8 visual reconciliation, Arabic/English RTL/LTR regression, responsive/accessibility review and preservation of API/RBAC/tenant/alarm/audit/reporting/commissioning semantics.

This scope must not be marked complete until code is implemented, repository gates pass, PR/CI evidence exists and merge evidence is recorded.

## Mandatory Site-Bound Licensing Production Gate — Not Yet Implemented

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

`VERSION` remains the source-version authority at `0.19.0` until the project's version/release policy is intentionally advanced by real merged implementation. Documentation of approved future work does not create a new software release.

## External Evidence Still Open

Physical controller/hardware qualification, live SMS evidence, WhatsApp provider acceptance, Telegram live/end-to-end acceptance, deployed MQTT/recovery evidence, endurance, production backup/restore/rollback/DR execution, BIO EGYPT physical installation/calibration/commissioning, licensing qualification, final installer qualification, customer UAT/Quality sign-off and production/customer acceptance remain separate gates unless actual evidence is recorded.

## Next-Session Start Point

1. Reconcile local Windows `main` with GitHub `main` and confirm a clean working tree.
2. Read this file, `IMPLEMENTATION_PLAN.md`, the UI/UX work package, the UI/UX visual freeze, and `docs/BIO-EMS-SITE-BOUND-LICENSING-ARCHITECTURE.md`.
3. Continue the approved UI/UX sequence unless licensing is explicitly started earlier.
4. After stabilization of the current UI/P8/localization/notification scope, execute LIC-01 -> LIC-06, then LIC-07 -> LIC-10, then LIC-11 -> LIC-13 with DEP-01 integration.
5. Do not qualify the final Production Installer before the licensing gate passes.
6. Do not claim UI/UX implementation, licensing implementation, installer qualification, physical receipt, Commissioning, provider acceptance or customer acceptance without actual evidence.
