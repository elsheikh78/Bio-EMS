# BIO-EMS Work Record — UI/UX Visual Refresh

**Decision date:** 4 September 2026
**Status:** APPROVED / DOCUMENTED / IMPLEMENTATION PENDING
**Repository authority:** GitHub `main`
**Baseline commit at documentation start:** `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`

## Purpose

Record the approved visual/product-experience work discussed on 4 September 2026 so that the next implementation session can resume without losing scope or design decisions.

## Approved Product Identity

1. Adopt the selected BIO-EMS logo concept identified in the design discussion as **option 5** as the preferred product-logo direction.
2. The production logo must support transparent/no-background use.
3. Logo assets must be prepared for practical application surfaces such as the application shell, opening/splash experience, reports/exports where appropriate, installer/product identity, and other controlled branding surfaces.
4. Final repository asset integration remains an implementation task; this record does not claim that generated visual concepts are already committed as production assets.

## Approved Global Visual Direction

BIO-EMS should move from a functional interface to a coherent, premium Environmental Monitoring System visual language while preserving operational clarity and regulated-use readability.

Approved direction:

- professional and visually distinctive opening/landing experience;
- coherent background treatment across application screens rather than unrelated page-by-page decoration;
- unified themes/tokens across the product;
- modern cards, spacing, typography, hierarchy, status treatment and data visualization;
- responsive behavior across supported desktop/mobile layouts;
- visual consistency across SYSTEM_OWNER and customer operational surfaces while preserving their security/role boundaries;
- bilingual Arabic/English presentation as a first-class requirement, not an afterthought;
- no visual redesign may weaken alarm visibility, status semantics, accessibility, tenant isolation, RBAC, or operational workflows.

## Opening / Product Entry Experience

Create a professional BIO-EMS opening experience using the selected identity and a controlled environmental-monitoring visual language. It should feel like a product entry surface rather than a generic admin template. It must remain performant and must not delay operational access unnecessarily.

## Dashboard Redesign

The existing Dashboard is approved for a substantial visual redesign.

Target behavior:

- more professional and visually impressive;
- consolidated so that the principal operational picture fits naturally within a single desktop viewport where practical;
- stronger hierarchy for current environmental status, active alarms, health/communication state, monitored-area summaries and important operational actions;
- reduce wasted space and avoid unnecessary scrolling;
- preserve authenticated telemetry-driven refresh/reconnect/polling behavior already implemented;
- preserve existing domain/API semantics unless a separate approved change is required.

The Dashboard redesign is a presentation/UX enhancement and must not manufacture new backend domain concepts.

## New Monitoring Measurements Screen

Add a dedicated screen reachable from a clear Dashboard/navigation action.

Purpose: provide an at-a-glance live measurement wall for monitored areas.

Approved concept:

- a card for each relevant **Monitored Area**;
- each card prominently displays the current measurement(s), initially centered on the temperature use case supported by the pilot;
- show operational state/status clearly using the established alarm-state semantics;
- include useful context such as monitored-area identity, freshness/timestamp and sensor/communication indication where supported by existing APIs;
- design for scanning many cards quickly;
- responsive grid behavior;
- authenticated live/event-driven refresh with reconnect/polling fallback consistent with the existing platform behavior;
- clicking/drilling into a card may lead to the existing monitored-area/detail workflow rather than duplicating domain logic.

Domain boundary remains:

`Site -> Monitored Area (Room) -> Sensor`

The new screen is a presentation surface; it does not create a new backend Monitoring Point/Asset domain.

## Remaining Frontend Screens

After the Dashboard and new measurement-card screen establish the visual system, review and align the rest of the frontend to the same design language, including operational/customer screens and SYSTEM_OWNER surfaces where applicable.

The review should cover at minimum:

- shell/navigation;
- page headers and actions;
- cards/panels;
- forms and validation presentation;
- tables and responsive overflow;
- filters/search controls;
- empty/loading/error states;
- alarm/status badges and severity presentation;
- reporting/preview surfaces;
- commissioning and installation/provisioning workflows;
- owner/customer consistency without crossing authorization boundaries.

## Localization / RTL Acceptance

Localization is an explicit acceptance gate for the visual refresh.

Known baseline at the start of this work:

- global Arabic/English localization work was previously merged;
- latest repository commit before this documentation is `a47b11e9fb0691ffd2ee231935b51cff7ecf0035`, **Merge RTL navigation drawer correction**, which mirrors desktop/mobile navigation to the right for Arabic and retains left placement for English;
- the visual refresh must preserve correct LTR/RTL behavior and must be visually reviewed in both Arabic and English for all materially changed screens.

## Implementation Constraints

1. GitHub `main` is authoritative; reconcile the Windows local copy before implementation.
2. Start implementation from baseline commit `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` or a later verified `main` HEAD.
3. Do not regress existing API contracts, alarm semantics, notification delivery, RBAC, tenant isolation, reporting, commissioning, installation provisioning, audit evidence or telemetry refresh.
4. Reuse existing backend data/API surfaces where sufficient. Any backend addition must be justified, Site/customer scoped, authenticated and tested.
5. Keep product performance suitable for live monitoring; decorative effects must not interfere with rapid alarm recognition or page responsiveness.
6. Preserve accessibility fundamentals: readable contrast, focus/keyboard behavior, understandable state labels and non-color-only critical status communication.
7. Verify desktop and mobile responsive layouts.
8. Verify Arabic and English separately, including navigation placement, icon/text ordering, tables/forms/cards and overflow.
9. Run the repository frontend quality gates and relevant regression tests before merge.

## Suggested Controlled Implementation Sequence

1. Audit current frontend architecture, routes, shared components, styling/theme system and duplicated patterns.
2. Establish design tokens/theme primitives and product identity assets.
3. Implement/refine application shell and opening experience.
4. Redesign Dashboard into the compact executive/operational layout.
5. Implement the dedicated Monitoring Measurements card screen and navigation entry.
6. Migrate remaining screens to the unified component/design system in controlled slices.
7. Execute English/LTR and Arabic/RTL visual acceptance across all changed surfaces.
8. Execute responsive/mobile acceptance.
9. Run lint/typecheck/build/tests and relevant frontend regression coverage.
10. Update README, CHANGELOG, PROJECT_STATE, IMPLEMENTATION_PLAN and release/version material only according to actual implementation/merge evidence.

## Definition of Done

This work is not complete merely because mockups exist. Closure requires production frontend implementation, navigation integration, bilingual/RTL acceptance, responsive acceptance, automated quality gates, regression verification, repository merge evidence and documentation reconciliation.

## Controlled Continuation Point

At the next software implementation session:

1. reconcile local `main` with GitHub;
2. verify the actual `main` HEAD is `a47b11e9fb0691ffd2ee231935b51cff7ecf0035` or later;
3. read this work record together with `PROJECT_STATE.md` and `IMPLEMENTATION_PLAN.md`;
4. audit the complete frontend before making broad styling changes;
5. implement the shared visual foundation first, then Dashboard, then the Monitoring Measurements screen, then systematically align the remaining screens;
6. preserve the already merged RTL drawer correction and verify all new/changed UI in Arabic and English.
