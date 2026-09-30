# S16-07-04 — Calibration History CSV Export Closure

## Status

**CLOSED / ACCEPTED**

## Closure statement

S16-07-04 is complete and accepted.

The Calibration History CSV export capability has been implemented, verified,
product-reviewed, corrected for the approved Windows/Microsoft Excel pilot
environment, merged to `main`, and followed by repository formatting
normalization.

This closure records the final accepted state of the slice. It does not expand
the reporting capability beyond the approved S16-07-04 scope.

## Delivered capability

The Reports Center now supports synchronous CSV export for:

- report family: `CALIBRATION-HISTORY`;
- endpoint: `POST /api/v1/reports/exports`;
- permission: `REPORT_EXPORT`;
- source: the backend-owned canonical Calibration History result;
- bounded report range consistent with the existing reporting contract.

The export contains the approved report identity, provenance, scope, sensor,
location, calibration-result, certificate, note, offset, and performer
evidence.

## CSV interoperability contract

The accepted CSV output provides:

- UTF-8 encoding with BOM;
- a leading `sep=,` directive for direct Microsoft Excel opening in the
  approved Windows pilot environment;
- comma-delimited RFC 4180-style quoted fields;
- CRLF line endings;
- stable English machine column identifiers;
- ISO 8601 timestamps;
- spreadsheet formula-injection protection for applicable textual values;
- normalized report filenames containing report family, report range, and
  Report ID.

The Excel direct-open correction was product-reviewed after the original CSV
implementation and became part of the accepted S16-07-04 contract.

## Architectural boundary

The CSV renderer serializes the canonical Calibration History result produced
by the reporting service.

It does not:

- query SQLite independently;
- recalculate reporting evidence;
- introduce a frontend-owned reporting calculation;
- create an asynchronous export lifecycle;
- retain or share generated report files.

This preserves the backend-owned reporting evidence boundary established by
the preceding S16-07 slices.

## Verification evidence

The implementation and corrective sequence recorded in Git includes:

- `077432c` — `feat(reporting): add calibration CSV export`;
- `056499d` — `fix(reporting): make calibration CSV export Excel-compatible`;
- `f28db0b` — `style(reporting): format calibration CSV renderer`;
- `143d3c3` — merge of S16-07-04 through PR #57;
- `0a99f46` — `chore(frontend): make Prettier line endings platform-safe`.

Verification completed during the implementation and corrective cycle included:

- Calibration CSV renderer tests passing;
- frontend API tests passing;
- backend typecheck passing;
- frontend typecheck passing;
- backend formatting check passing;
- Excel direct-open behavior corrected and accepted;
- repository working tree returned clean after integration.

The later frontend Prettier configuration normalization resolved the
Windows line-ending mismatch without changing the S16-07-04 reporting
behavior.

## Product acceptance

The CSV export was reviewed as an actual downloadable reporting artifact.

The initial implementation required a compatibility correction so that the
CSV opens directly in Microsoft Excel with fields distributed into separate
columns in the approved pilot environment.

That correction was implemented, tested, pushed, reviewed, and merged.

S16-07-04 is therefore accepted as complete.

## Out of scope

The following remain outside S16-07-04:

- PDF export;
- asynchronous export jobs;
- retained report files;
- report sharing;
- additional report families.

BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.

## Next slice

The next reporting slice is:

**S16-07-05 — Calibration History PDF Export**

The PDF implementation must reuse the same backend-owned canonical reporting
result and must not introduce an independent reporting evidence calculation.