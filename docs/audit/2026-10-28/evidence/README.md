# Sanitized Audit Evidence

Baseline `d151b1f`,28 October 2026. Component `*-results.json` contains commands, exit codes and durations. Referenced raw log basenames identify scratch execution logs; raw logs are intentionally not committed or distributed because they contain local runtime context and are unnecessary for the reviewed result summary. Their absence is explicit, not a claim that those files are present in this directory.

`dependencies.json` preserves registry affected-package/advisory metadata for all/production scopes with counts. `security-probe.spec.ts.txt` is an isolated reproducible synthetic fixture recording current auth gaps. Source and document inventories outside this folder allow baseline comparison and archive integrity checks.

C host suite outputs were `offline queue: capacity, FIFO, reboot, retry, corruption PASS` and `RTC calendar and GSM protocol tests: PASS`. Probe result: 2 tests passed (both asserted current defects); routine test counts are separately listed in VERIFICATION. No physical or provider acceptance report was generated.
