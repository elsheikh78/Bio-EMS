# BIO-EMS Project State

**State date:** 4 September 2026

**Release prepared for publication:** `v0.19.0`

**Current source-software version:** `0.19.0`

**Current phase:** **P8 SOURCE SOFTWARE, GLOBAL LOCALIZATION, P8-01A TELEGRAM EXTENSION, AND RTL NAVIGATION CORRECTION COMPLETE / MERGED. UI/UX PRODUCT REFRESH IS APPROVED LATER SOFTWARE SCOPE AND NOT YET IMPLEMENTED.**

## Current Controlled Continuation

1. Treat GitHub `main` as authoritative and reconcile the local Windows working copy before further implementation.
2. Preserve all P0-P8 closure and evidence boundaries. UI/UX refresh is new approved scope and must not rewrite historical closure claims.
3. Preserve the global Arabic/English localization closure and the RTL navigation correction. The latest observed `main` baseline before the new UI/UX documentation package is `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` (`Merge RTL navigation drawer correction`).
4. Execute the approved UI/UX product refresh from `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md` beginning with a complete frontend inventory/design-system audit.
5. The approved UI direction includes the selected BIO-EMS logo concept (option 5, transparent/background-independent production assets), a professional opening experience, coherent theme/background system, compact one-screen-oriented Dashboard redesign, and a new Dashboard-accessible Monitoring Areas Live Board with one live measurement card/tile per Monitored Area.
6. Reconcile all customer and SYSTEM_OWNER screens to the same professional design system while preserving trust boundaries, permissions, operational clarity, accessibility, responsiveness, Arabic/English and RTL/LTR behavior.
7. Preserve telemetry-driven refresh/reconnect/fallback behavior for Dashboard and Monitored Areas and apply consistent live behavior to the new Live Board.
8. Do not invent a second Monitored Area backend domain. The controlled domain remains `Site -> Monitored Area (Room) -> Sensor`.
9. Keep live-provider, hardware qualification, production deployment, field Commissioning/UAT and customer acceptance as separate evidence tracks.
10. Preserve passed Email SMTP evidence. Meta WhatsApp remains externally blocked; Telegram live bot/end-to-end evidence remains open unless separately executed and documented.
11. DEP-01 Full Offline Windows Installer remains approved later scope and is not yet implemented/qualified.

## Implemented Software Position

- P0-P7 software/product closure remains valid.
- P8-01 WhatsApp/Email source delivery is complete; Email live evidence passed; WhatsApp live evidence remains blocked by Meta.
- P8-01A Telegram source delivery is complete/merged/CI verified; live bot and end-to-end evidence remain open.
- P8-02 through P8-08 SYSTEM_OWNER installation provisioning/RBAC source work is complete/merged/CI verified.
- Global customer and SYSTEM_OWNER Arabic/English localization is complete/merged/CI verified.
- RTL navigation drawer correction is merged on `main` at `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`.
- React Dashboard and Monitored Areas already have authenticated telemetry-driven refresh, reconnect/cleanup and polling fallback; these are non-regression requirements for the refresh.

## Approved UI/UX Refresh Scope — Not Yet Implemented

The controlled work package is:

`docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`

Approved scope:

- selected BIO-EMS logo direction and reusable transparent/background-independent brand assets;
- professional opening/entry experience;
- reusable global theme/design tokens and coherent backgrounds/surfaces;
- compact, high-information operational Dashboard redesign;
- new Monitoring Areas Live Board linked from Dashboard;
- live cards/tiles per Monitored Area showing current measurement, unit, state and freshness/communication indication where supported;
- full customer frontend visual review;
- full SYSTEM_OWNER frontend visual review;
- full P8 installation workflow visual reconciliation;
- Arabic/English and RTL/LTR regression across all affected routes;
- responsive/accessibility review;
- preservation of API, RBAC, tenant isolation, Alarm, audit, reporting and commissioning semantics.

This scope must not be marked complete until code is implemented, normal repository gates pass, PR/CI evidence exists and the merge SHA is recorded.

## Release / Version Position

`VERSION` remains the source-version authority at `0.19.0` until the project's version/release policy is intentionally advanced by real merged implementation. Documentation of the new work package alone does not create a new software release.

## External Evidence Still Open

Physical controller/hardware qualification, live SMS evidence, WhatsApp provider acceptance, Telegram live/end-to-end acceptance, deployed MQTT/recovery evidence, endurance, production backup/restore/rollback/DR execution, BIO EGYPT physical installation/calibration/commissioning, customer UAT/Quality sign-off and production/customer acceptance remain separate gates unless actual evidence is recorded.

## Next-Session Start Point

1. Reconcile local Windows `main` with GitHub `main` and confirm a clean working tree.
2. Read this file, then `IMPLEMENTATION_PLAN.md`, then `docs/project-management/UI-UX-PRODUCT-REFRESH-WORK-PACKAGE-2026-09-04.md`.
3. Confirm baseline commit `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` behavior remains intact: Arabic drawer/right, English drawer/left.
4. Audit all frontend routes/components/styles before implementation.
5. Establish the shared brand/design system before redesigning individual screens.
6. Then implement opening experience -> Dashboard -> Monitoring Areas Live Board -> Monitored Areas/high-frequency operations -> remaining customer screens -> SYSTEM_OWNER/P8 screens -> full regression/documentation closure.

Do not claim UI/UX implementation, physical receipt, Commissioning, provider acceptance or customer acceptance without actual evidence.
