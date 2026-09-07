# UX-02 Brand and Shared Design System Closure — 7 September 2026

## Status

**IMPLEMENTED / BRANCH VERIFIED / AWAITING PR MERGE**

Branch: `agent/ux-02-brand-theme`

This record closes the implementation and local verification of UX-02 only. It does not claim UX-03 opening experience, UX-04 Dashboard redesign, UX-05 Monitoring Areas Live Board, later full-surface reconciliation, merge, CI, release, licensing, installer qualification or customer acceptance.

## Implemented Scope

- Replaced the earlier unrelated runtime logo with production assets derived from the final approved Option 5 artwork.
- Added a transparent horizontal lockup and transparent compact mark for application/navigation/favicon use.
- Added a reusable `BrandLogo` component that never mirrors the artwork under RTL.
- Expanded shared tokens for brand, navigation, surfaces, controls, semantic states, focus treatment and chart series.
- Added equivalent Light and Dark palettes while keeping Light as the default operating theme.
- Added persisted optional Dark monitoring mode using `bioems.colorMode` local storage and a safe Light fallback when storage is unavailable.
- Added localized English/Arabic theme controls in the authenticated application header.
- Reconciled shared Card, Paper, Button and Outlined Input primitives without changing route, authentication, RBAC, tenant, Alarm, telemetry, reporting or commissioning semantics.
- Preserved Arabic drawer/right and English drawer/left behavior.
- Added the approved compact mark as the application favicon and retained the deep-teal browser theme color.

## Production Assets

| Asset                                             | Purpose                               | SHA-256                                                            |
| ------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `frontend/src/assets/bio-ems-logo-horizontal.png` | Primary horizontal transparent lockup | `412d8a455502551600c9ff0e0872f65a11ef316e4d132d9829d82f6421812cdb` |
| `frontend/src/assets/bio-ems-mark.png`            | Compact transparent mark / favicon    | `1889779f183d3dd7bb7af6d807688e68d26d39ad358d5095538df49734704603` |

The assets were created as controlled background extraction/mark isolation edits from `docs/assets/ui-ux/bio-ems-final-logo.png`. The approved geometry, wordmark, sensor-network motif, gradients and green node accent were preserved; the baked checkerboard background is not present in the runtime variants.

## Verification Evidence

Executed from `frontend/`:

- `npm run typecheck` — PASS.
- `npm run test:run` — PASS, 46 files and 281 tests.
- `npm run lint` — PASS with zero warnings.
- `npm run format:check` — PASS.
- `npm run build` — PASS.

The existing Vite chunk-size advisory remains non-blocking and is not introduced as a UX-02 functional failure.

## Non-Regression Boundaries

UX-02 changes presentation infrastructure only. No API contract, backend capability, permission matrix, authentication boundary, customer/Site scope, telemetry refresh behavior, Alarm lifecycle, audit evidence, report export contract, notification-provider evidence or P8 installation state was changed.

## Controlled Next Step

1. Commit and publish `agent/ux-02-brand-theme`.
2. Open the UX-02 pull request against `main` and require CI success.
3. Merge and record the PR/CI/merge SHA in this closure record and project state.
4. Reconcile local `main`, then start UX-03 Opening / Entry Experience from the merged baseline.
