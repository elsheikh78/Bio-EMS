# UX-07 Remaining Customer Surfaces Closure — 7 September 2026

## Status

**IMPLEMENTED / BRANCH VERIFIED / AWAITING PR MERGE**

Branch: `agent/ux-07-customer-surfaces`

## Implemented Scope

- Expanded the customer operational workspace to expose Live Board, Alarms, Devices and Commissioning alongside the existing authorized workflows.
- Kept every workspace action filtered through the centralized permission vocabulary.
- Removed stale workspace readiness statements that incorrectly described completed live telemetry, acknowledgement and Reporting Center work as pending.
- Added Commissioning loading, no-Site and refresh-in-progress states.
- Added responsive Commissioning totals for configured, ready and blocked Sensors using authoritative readiness results.
- Wrapped Commissioning evidence in an overflow-safe table container for narrow viewports.
- Preserved the separate ADMIN customer acceptance decision and SYSTEM_OWNER technical commissioning boundary.
- Improved customer user-management headings, status chips and action groups for narrow screens.
- Added a safe return action to the not-authorized page and initial heading focus to the not-found page.
- Retained the existing restoration-error recovery/logout actions and initial-focus behavior.

## Verification Evidence

- Frontend typecheck — PASS.
- Frontend automated tests — PASS, 51 files and 292 tests.
- Frontend lint — PASS with zero warnings.
- Frontend formatting — PASS.
- Frontend production build — PASS with only the existing non-blocking chunk-size advisory.

## Non-Regression Boundaries

UX-07 does not change backend contracts, permissions, tenant isolation, customer acceptance semantics, technical commissioning authority, audit evidence, user lifecycle rules, telemetry, Alarm, calibration, notification or reporting behavior.

## Controlled Next Step

Publish the branch PR, require CI success, merge and record PR/CI/merge evidence before starting UX-08 SYSTEM_OWNER and P8 Workflow Refresh.
