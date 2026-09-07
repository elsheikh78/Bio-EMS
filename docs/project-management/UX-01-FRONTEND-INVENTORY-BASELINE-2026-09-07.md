# UX-01 Frontend Inventory and Non-Regression Baseline — 7 September 2026

## Outcome

UX-01 inventory and baseline capture are complete on branch `agent/ux-01-visual-baseline` from authoritative `main@aa76cf988013114d4efa471d7b4e97267724ea0f`.

This package records the current frontend before visual implementation. It makes no claim that UX-02 through UX-09 are implemented and changes no runtime behavior, API contract, permission, tenant boundary, Alarm rule, reporting evidence or installation workflow.

## Frontend Surface Inventory

The frontend contains 137 source files under `frontend/src` across these controlled areas:

- application/provider shell, global error handling and accessibility helpers;
- customer authentication/session storage and isolated SYSTEM_OWNER authentication;
- centralized authorization permissions and route policies;
- Arabic/English localization and RTL/LTR direction;
- Dashboard, Monitored Areas, Alarms, Devices, notification deliveries, calibration, reports, commissioning, configuration and administration;
- SYSTEM_OWNER console, customer fleet, commercial operations and installation lifecycle;
- authenticated telemetry synchronization and domain-specific query/API/contract layers;
- shared components, navigation, assets and theme tokens.

### Customer routes

| Route | Surface | Boundary |
| --- | --- | --- |
| `/login` | Customer authentication | Login boundary |
| `/` | Operational workspace | Auth + centralized route permission |
| `/dashboard` | Operational Dashboard | Auth + centralized route permission |
| `/monitored-areas` | Site / Monitored Area / Sensor hierarchy | Auth + centralized route permission |
| `/alarms` | Alarm operations | Auth + centralized route permission |
| `/devices` | Device and communication health | Auth + centralized route permission |
| `/notification-deliveries` | Delivery operations | Auth + centralized route permission |
| `/sensors-calibration` | Sensor calibration evidence | Auth + centralized route permission |
| `/reports` | Reporting Center and exports | Auth + centralized route permission |
| `/commissioning` | Commissioning/productization | Auth + centralized route permission |
| `/configuration` | Operational configuration | Auth + centralized route permission |
| `/users` | Users and audit | Auth + centralized route permission |

`/foundation` remains a legacy redirect to `/`; unknown customer routes render the controlled Not Found surface.

### SYSTEM_OWNER routes

| Route | Surface | Boundary |
| --- | --- | --- |
| `/system-owner/login` | Restricted platform authentication | Platform login boundary |
| `/system-owner` | SYSTEM_OWNER console | Isolated platform authentication |
| `/system-owner/customers` and `/:customerId` | Customer/site fleet | Isolated platform authentication |
| `/system-owner/licenses` | Commercial/license operations | Isolated platform authentication |
| `/system-owner/updates` | Update operations | Isolated platform authentication |
| `/system-owner/service` | Maintenance/support operations | Isolated platform authentication |
| `/system-owner/installations` | P8 installation lifecycle | Isolated platform authentication |

## Preserved Runtime Baseline

- Domain hierarchy remains `Site -> Monitored Area (Room) -> Sensor`; no second monitoring domain exists.
- Customer and SYSTEM_OWNER authentication flows remain isolated.
- Server authority remains primary; frontend route/navigation filtering is a usability layer, not authorization.
- Customer navigation is derived from the centralized permission matrix.
- Arabic uses RTL with permanent and temporary navigation drawers on the right; English uses LTR with drawers on the left.
- Language selection persists and built-in Arabic/English resources cover customer and P8 surfaces.
- Dashboard and Monitored Areas use authenticated event-driven telemetry invalidation with reconnect/cleanup and polling fallback through the shared real-time synchronization path.
- Dashboard manual refresh refetches all four current Dashboard data sources as one controlled action.

## Styling Inventory and UX-02 Inputs

Current reusable foundations:

- `frontend/src/theme/tokens.ts` defines an initial light palette, typography, spacing and breakpoints.
- `frontend/src/theme/theme.ts` maps those tokens into the MUI theme.
- `AppShell`, `AppHeader`, `AppNavigation`, Dashboard visual components and common feedback components provide reusable structural entry points.

Items to reconcile under UX-02 and later slices:

- the theme supports light mode only and has no persisted optional monitoring-room dark mode;
- brand/nav colors and surface values are repeated as local hex/rgba literals in shell and page components;
- page spacing, headers, cards, status treatments, loading/empty/error states and dense tables are implemented locally rather than through a complete shared primitive set;
- customer and SYSTEM_OWNER login surfaces duplicate form-shell structure;
- the existing runtime logo asset predates the approved final master;
- Dashboard contains fixed customer/evidence copy and several local visual treatments that must move into localization/theme primitives;
- no Dashboard-accessible Monitoring Areas Live Board route exists yet;
- the current production bundle reports a large main JavaScript chunk warning and should be assessed during UX implementation without changing behavior casually.

## Baseline Verification

Executed from a clean dependency install in `frontend/` on 7 September 2026:

| Gate | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; existing large-chunk advisory only |
| `npm run lint` | PASS |
| `npm run format:check` | PASS |
| `npm run test:run` | PASS — 44 files / 277 tests |

The passing suite includes customer authentication/session lifecycle, platform routing decisions, centralized RBAC/route filtering, AppShell accessibility, Arabic localization, right-side RTL drawer behavior, Dashboard and Monitored Areas behavior, Dashboard refresh, API/contract tests and the real-time telemetry synchronization hook.

## Next Controlled Slice

Proceed to UX-02 Brand and Shared Design System using the three repository master assets linked from the Visual Design Freeze. UX-02 must preserve this baseline and must not claim UX-03 opening experience, UX-04 Dashboard, UX-05 Live Board or later full-surface reconciliation until their code and tests exist.
