# Sprint Progress — Historical Ledger

> **DOCUMENT ROLE:** Historical execution ledger only. This file is **not** the authoritative current project status.
>
> **Single current-state authority:** `/PROJECT_STATE.md`
>
> Use this ledger only to trace historical Sprint/BF/PVR/P-phase work and integration evidence. When any historical statement here conflicts with the current state, `PROJECT_STATE.md` controls.

## Current handoff pointer — 3 September 2026

P0-P7 is **SOFTWARE PRODUCT COMPLETE** for the approved software scope. P7-03 through P7-08 closed through PR #145 / CI run #522 / merge `3798277bea14820632c8e1edd0b83df91f8f7084`.

P7-01 established the isolated SYSTEM_OWNER frontend boundary. P7-02 added SYSTEM_OWNER customer fleet list/detail/create workflows, Site/installation context derived from recorded commercial bindings, authenticated provenance, and owner-session query isolation. P7-02 closed through PR #142 / CI run #516 / workflow `33543271797` / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`.

External hardware/provider/field/production/customer evidence remains separate from P7 software work.

P8-01 primary WhatsApp and Email delivery source work closed through PR #147 / CI run #526 / merge `17bbfc1d5623ad7bdf47d99e6d5954fc33a9666d`. Secret-safe provider configuration and the controlled SMTP smoke-test command closed through PR #148 / CI run #528 / merge `a045e933dcd6583f1e7e32e73562f0ab2b45dd4c`. On 3 September 2026 the controlled SMTP test returned `SENT` and the recipient confirmed inbox arrival; no secret or recipient address is tracked. Meta developer registration still loops after Email verification, so live WhatsApp credentials, template approval, delivery and end-to-end dual-channel evidence remain open.

On 3 September 2026 P8-01A approved Telegram as a distinct interim primary channel rather than relabeling WhatsApp. Source implementation extends recipient, escalation, durable delivery, Delivery Operations and configuration UI contracts and adds a controlled Telegram smoke test. Live bot, Chat ID, receipt and end-to-end `TELEGRAM + EMAIL` evidence remain open; WhatsApp remains available for later activation and SMS remains emergency fallback.

P8-02 through P8-08 source implementation closed through PR #152 / CI run #537 / merge `0666dd2bbf837c80cf52542062cf7cdd9a337907`. It added explicit customer ownership, the approved role matrix, SYSTEM_OWNER customer ADMIN lifecycle, controlled installation revisions and exact receipts, separated technical/customer decisions, configuration activation, and bilingual UI. Physical receipt, field Commissioning, customer acceptance and production execution are not claimed.

The 3 September localization correction replaced the partial P8/SYSTEM_OWNER-only result with global Arabic/English resources for the customer shell and operational workflows, persisted RTL/LTR selection, and selected-language reporting requests. Frontend gates passed 44 test files / 276 tests; integration closed through PR #155 / CI run #543 / merge `e0f305c2286ff577f20df076b64118e327a5ba0c`.

For the authoritative continuation read, in order:

1. `/PROJECT_STATE.md` — current-state authority and P7-03 start pointer.
2. `/IMPLEMENTATION_PLAN.md` — controlled P0-P7 execution status and detailed P7-03 continuation instructions.
3. `/docs/project-management/P7-FINAL-PRODUCT-COMPLETION-PLAN-2026-09-01.md` — P7 work-package definition.
4. `/docs/project-management/P7-02-CUSTOMER-SITE-FLEET-CLOSURE-2026-09-01.md` — latest closed package evidence.
5. `/docs/project-management/DOCUMENTATION-STATE-AUDIT-2026-09-01.md` — documentation reconciliation record.
6. `/docs/architecture/roadmap.md` — forward software/external-evidence roadmap.

## BF-10 reporting closure — 31 August 2026

Status: **COMPLETE / MERGED / CI VERIFIED / CLOSED**

Historical detail remains available in Git history and the dedicated BF/Sprint closure documents. This ledger is intentionally no longer maintained as a second full copy of current project state.

## P0-P6 software closure — 1 September 2026

- P0 — Professional Software / Reporting Baseline: **COMPLETE / MERGED / CI VERIFIED**.
- P1 — Notification Delivery Engine: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**.
- P2 — Site Controller Runtime: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**; physical qualification open.
- P3 — Pilot Commissioning Tooling: **SOFTWARE COMPLETE / MERGED / CI VERIFIED**; field commissioning/UAT open.
- P4 — Production Hardening: **SOFTWARE CONTROLS COMPLETE / MERGED / CI VERIFIED**; production execution evidence open.
- P5 — SYSTEM_OWNER / Commercial Operations: **BACKEND/DOMAIN SOFTWARE COMPLETE / MERGED / CI VERIFIED**; owner-facing product UI completion continues through P7.
- P6 — Productization / Deployment / Acceptance: **SOFTWARE PRODUCTIZATION COMPLETE / MERGED / CI VERIFIED**; deployment/field/customer acceptance open.

## P7 execution — 1 September 2026

- P7-01 — SYSTEM_OWNER Frontend Boundary and Console Shell: **COMPLETE / MERGED / CI VERIFIED** through PR #141 / merge `873b55439f02fbb7de84d29631d22af399208dec`.
- P7-02 — Customer / Site Fleet Management: **COMPLETE / MERGED / CI VERIFIED** through PR #142 / CI run #516 / merge `f84a3f9ec8a290e4765d4228a6209140cdba5f3d`.
- P7-03 through P7-08: **COMPLETE / MERGED / CI VERIFIED** through PR #145.

P7 was created after the P0-P6 closure audit identified that source/domain capability completion was not yet equivalent to complete end-to-end product presentation. It is new scope and does not retroactively change historical P0-P6 closure evidence.

## Ledger policy

- New current-state decisions go to `PROJECT_STATE.md`.
- Detailed active scope goes to `IMPLEMENTATION_PLAN.md` and the controlled P7 plan.
- Detailed completion evidence goes to dedicated dated closure documents under `docs/project-management/`.
- Historical Sprint/PR documents remain immutable evidence of their time and are not treated as current status.
- Software completion must never be used to manufacture physical, provider, field, UAT, or customer-acceptance evidence.
