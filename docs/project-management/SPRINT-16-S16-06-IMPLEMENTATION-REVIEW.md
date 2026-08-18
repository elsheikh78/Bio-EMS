# S16-06 — Executive Dashboard and Operational Charts Implementation Review

## Status

**READY FOR PRODUCT OWNER VISUAL REVIEW — CONTRACT-GATED CAPABILITIES EXPLICIT**

This review records the implemented S16-06 Dashboard slice against the approved
S16-01 requirements, S16-02 design direction, and S16-03 reporting/evidence rules.

The implementation improves the current operational Dashboard without introducing a
parallel Domain model, a frontend-only reporting calculation, or unsupported historical
claims.

## Implemented scope

### Exception-first KPI hierarchy

The existing authoritative Dashboard summary remains the source for:

- Site count;
- Monitored Area count;
- Device count;
- Sensor count;
- active Alarm count;
- Offline Device count.

Active Alarms and Offline Devices receive semantic visual emphasis only when their
recorded count is greater than zero. The other KPI cards retain the approved primary
accent. Color is not the only carrier of meaning: every card keeps its visible label and
numeric value.

### Device connectivity distribution

The Dashboard presents a current Online/Offline distribution derived from the existing
summary contract:

`Online = max(totalDevices - offlineDevices, 0)`

The defensive lower bound prevents a negative visual value if an inconsistent response
reaches the component. This calculation is a current-snapshot partition only; it is not
a historical availability calculation.

### Alarm severity distribution

The Dashboard presents the current recorded Critical, Warning, and Information counts
from the existing Alarm-statistics contract. It does not reinterpret severity or infer
environmental compliance.

### Accessible chart equivalents

Both distributions include:

- visible category labels;
- exact numeric values;
- an explicit total;
- semantic color plus text;
- an empty-data message;
- decorative chart bars hidden from assistive technology because the exact values are
  already represented in the adjacent definition list.

### Partial-data behavior

The operational overview remains visible when either the summary or Alarm-statistics
source succeeds independently. The failed panel is replaced by an explicit unavailable
state and the page presents a partial-data warning.

This prevents a successful source from disappearing because an unrelated request
failed. Existing section-level Retry actions remain authoritative for the failed
request.

## Contract-gated capabilities

The following S16-06 targets are intentionally not represented as available:

| Target capability                     | Current evidence boundary                                                        | Disposition                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Online/Stale/Offline distribution     | summary distinguishes Offline but does not expose a separate Stale count         | show Online/Offline and disclose the missing Stale distinction |
| telemetry time-range trend            | current telemetry endpoint is latest-reading only                                | blocked pending a versioned time-range contract                |
| threshold overlays                    | no approved Dashboard trend series/threshold-basis response exists               | blocked with the trend contract                                |
| Alarm trend and duration chart        | current statistics are snapshot counts, not a time-bucketed lifecycle series     | blocked pending the approved Alarm-history adapter             |
| historical Device availability        | current Device state cannot prove transitions or outage duration                 | blocked as defined by S16-03                                   |
| calibration due/overdue presentation  | no approved Dashboard calibration-summary contract exists                        | blocked pending an authorized backend contract                 |
| missing-data interval visualization   | latest readings cannot establish expected samples across a requested time window | blocked pending time-range and quality metadata                |
| coordinated Site/time-range filtering | current Dashboard endpoints do not accept the approved canonical filter contract | blocked pending backend filter support                         |

These entries are delivery gates, not permission to synthesize demo values in the
production Dashboard.

## Files in the implementation slice

| File                                               | Purpose                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| `frontend/src/dashboard/DashboardVisuals.tsx`      | accessible operational distribution components      |
| `frontend/src/dashboard/DashboardVisuals.spec.tsx` | distribution, defensive, and partial-data tests     |
| `frontend/src/pages/DashboardPage.tsx`             | Dashboard integration and exception-first KPI style |
| `frontend/src/pages/DashboardPage.spec.tsx`        | page behavior and regression coverage               |
| `frontend/src/localization/resources.ts`           | typed user-facing Dashboard messages                |

## Verification evidence

The local verification gate includes:

- TypeScript project build;
- ESLint with zero warnings;
- Prettier formatting check;
- focused Dashboard component and page tests;
- production Vite build;
- `git diff --check`.

Focused coverage verifies:

- exact Online and Offline values;
- exact Alarm-severity values;
- accessible textual equivalents;
- empty distributions;
- inconsistent input cannot produce a negative Online value;
- one successful source remains visible when the other source is unavailable;
- the partial-data warning is shown;
- existing loading, error, retry, empty, room-status, latest-telemetry, summary, and
  Alarm-statistics behavior remains intact.

## Product Owner visual-review gate

**Preliminary visual direction approved on 18 August 2026. Final visual approval is
still pending the completed navigation treatment, responsive review, and Product Owner
review of the running Dashboard with real local data. PR #50 remains Draft.**

The Product Owner review should confirm:

- the visual hierarchy makes active Alarms and Offline Devices immediately visible;
- the distribution panels are understandable without relying only on color;
- the information density is appropriate on desktop and tablet widths;
- the partial-data and contract-gap messages are clear without implying total system
  failure;
- the current snapshot is useful while the historical chart contracts remain blocked.

## S16-06 completion boundary

Approval of this slice permits it to merge as the evidence-safe current Dashboard
enhancement. It does not declare all S16-06 target capabilities complete.

Full S16-06 closure still requires either:

1. implementation of the versioned backend contracts for the gated trend, Stale,
   calibration, duration, quality, and filter capabilities; or
2. an explicit Product Owner scope decision that moves those capabilities into named
   downstream work items without representing them as delivered.
