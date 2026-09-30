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
- SYSTEM_OWNER installation screen, derived counts, lifecycle register, and Modify/Review/Apply workflow. At PR #152 closure, the page contained bilingual foundation copy but no user-accessible global language switch and retained English-only lifecycle/revision strings; therefore it was not yet valid to claim the complete P8-08 bilingual acceptance criterion.
- ADMIN customer-acceptance surface within Commissioning. At PR #152 closure, this surface remained English-only.

## Verification

- Backend TypeScript, ESLint and Prettier gates passed.
- Backend full regression: 105 test files, 751 tests passed locally.
- Frontend TypeScript, ESLint and Prettier gates passed.
- Frontend full regression: 42 test files, 270 tests passed locally.
- GitHub CI run #537 succeeded before merge.

## P8-08 localization correction

The PR #152 closure evidence above is retained as historical source evidence, but its
original bilingual-delivery statement was broader than the implemented UI. The
follow-up localization completion adds a globally available Arabic/English switch,
persists the choice in browser storage, applies Arabic RTL or English LTR to the
document and Material UI theme, and translates the visible P8 installation and
customer-acceptance workflows. P8-08 bilingual closure must be attributed to that
follow-up change and its own passing verification, not retroactively to PR #152.

Follow-up local verification: frontend TypeScript, ESLint, Prettier and production
build passed; the full frontend regression passed with 44 test files and 274 tests,
including dedicated global-switch persistence/RTL and P8 Arabic rendering coverage.
The final branch/CI result is the controlling verification evidence.

## Evidence boundary

Automated receipt scenarios prove source behavior only. They do not prove a physical
controller received configuration. No field technical Commissioning, customer ADMIN
acceptance, BIO EGYPT UAT, production deployment, live SMTP delivery or live WhatsApp
delivery is claimed by this closure. P8-01 live provider acceptance resumes separately.
