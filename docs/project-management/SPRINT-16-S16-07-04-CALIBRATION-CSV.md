# S16-07-04 — Calibration History CSV Export

## Status

**IMPLEMENTED / VERIFICATION IN PROGRESS / PRODUCT REVIEW PENDING**

## Scope

This slice adds the first approved export capability to the Reports Center:

- format: CSV only;
- family: `CALIBRATION-HISTORY` only;
- endpoint: `POST /api/v1/reports/exports`;
- permission: `REPORT_EXPORT`;
- generation: synchronous within the bounded 366-day record-report limit;
- source: the same backend-owned canonical result used by Preview.

## CSV contract

- UTF-8 with BOM for the approved Windows/Excel Pilot environment;
- exported CSV files are expected to open directly in Microsoft Excel with fields distributed into separate columns without requiring manual delimiter import;
- Excel direct-open compatibility is provided via a leading `sep=,` directive, followed by comma-delimited RFC 4180-style quoted data and CRLF line endings;
- stable English machine column identifiers;
- ISO 8601 timestamps;
- report ID, contract version, generated time, source, range, time zone, and generating
  User repeated as companion columns;
- Sensor, Site, Room, result, certificate, note, offset, and performer evidence;
- spreadsheet formula-injection protection for text beginning with `=`, `+`, `-`, `@`,
  tab, or carriage return;
- safe normalized filename containing report family, dates, and Report ID.

Numeric values remain numeric text and are not prefixed by formula protection.

## Capability boundary

The export renderer does not query SQLite and does not recalculate report evidence. It
serializes the canonical Calibration History result created by the existing service.

PDF, asynchronous export lifecycle, retained files, sharing, and other report families
remain outside this slice. BIO EGYPT remains **NOT COMMISSIONED / NOT ACCEPTED**.