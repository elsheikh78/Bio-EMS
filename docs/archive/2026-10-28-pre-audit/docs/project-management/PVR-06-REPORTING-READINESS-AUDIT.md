# PVR-06 — Reporting readiness audit

## Verdict

The Reports Center is **partially accepted**. Calibration Status and History is the only controlled report family currently available for preview, CSV, and PDF. The other four approved catalogue families must remain visibly incomplete until their evidence projections and export contracts are implemented.

| Family                         | Verdict                  | Required closure                                             |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ |
| Calibration Status and History | Available                | Production smoke evidence                                    |
| Temperature Performance        | Partial                  | Bounded historical telemetry range/aggregation contract      |
| Alarm History                  | Partial                  | Lifecycle projection with actor and transition evidence      |
| Device Communication Health    | Blocked                  | Durable health-history ledger                                |
| Audit and Operations           | Ready for implementation | Reporting projection over the existing immutable Audit store |

## Corrections

- The catalogue no longer reports `AUDIT_STORE_REQUIRED`; BF-02 provides that store.
- The remaining Audit dependency is accurately identified as `OPERATIONS_REPORT_PROJECTION_REQUIRED`.
- The Reports Center renders every approved family, its readiness, preview/export support, and remaining dependency. Incomplete families are no longer hidden behind the Calibration builder.

## Control decision

PVR-06 closes the reporting **audit**, not the missing report implementation. PVR-07 must carry the four unresolved families as release blockers. No readiness or export capability is inferred from an existing data store alone.
