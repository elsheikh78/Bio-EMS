# P8-02 through P8-08 Source Closure

**Date:** 2 September 2026  
**Status:** SOURCE SOFTWARE COMPLETE / MERGED / CI VERIFIED  
**PR:** #152  
**CI:** run #537 — SUCCESS  
**Merge:** `0666dd2bbf837c80cf52542062cf7cdd9a337907`

## Delivered

- Explicit ownership bindings for customer Users and Sites, including controlled legacy backfill.
- SYSTEM_OWNER-only topology provisioning and customer ADMIN account lifecycle.
- Approved ADMIN/OPERATOR/VIEWER permission realignment in backend and frontend.
- Installation snapshots covering company, Sites, Areas, Telemetries, Devices and channel mappings.
- Validated, checksummed, versioned revisions with actor/reason and append-only lifecycle evidence.
- Pending delivery, sent, exact device receipt, configuration-active, correction and Commissioned states.
- Safe revision application that leaves the previous active configuration intact until an exact receipt.
- Independent SYSTEM_OWNER technical decision and customer ADMIN acceptance; OPERATOR/VIEWER are read-only.
- Bilingual SYSTEM_OWNER installation screen, derived counts, lifecycle register, and Modify/Review/Apply workflow.
- ADMIN customer-acceptance surface within Commissioning.

## Verification

- Backend TypeScript, ESLint and Prettier gates passed.
- Backend full regression: 105 test files, 751 tests passed locally.
- Frontend TypeScript, ESLint and Prettier gates passed.
- Frontend full regression: 42 test files, 270 tests passed locally.
- GitHub CI run #537 succeeded before merge.

## Evidence boundary

Automated receipt scenarios prove source behavior only. They do not prove a physical
controller received configuration. No field technical Commissioning, customer ADMIN
acceptance, BIO EGYPT UAT, production deployment, live SMTP delivery or live WhatsApp
delivery is claimed by this closure. P8-01 live provider acceptance resumes separately.
