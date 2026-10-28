# Global Localization and P8-01 Email Handoff

**Date:** 3 September 2026  
**Source status:** implemented / merged / CI verified  
**External status:** Email passed; Meta WhatsApp blocked; P8-01 not fully closed

## Corrected finding

The earlier language work made the switch persistent and covered the P8/SYSTEM_OWNER workflows, but the built-in localization provider continued to supply English resources and several customer operational pages retained fixed English copy. A user test on `/sensors-calibration` exposed the gap. Therefore earlier wording that implied complete global bilingual coverage was too broad.

## Implemented correction

- Built-in Arabic resources are selected whenever Arabic is active.
- Arabic selection persists and applies `lang=ar`, `dir=rtl`, and the RTL Material UI theme; English restores LTR.
- Customer navigation, header, Workspace, Dashboard, Monitored Areas, Alarms, Devices, Notification Delivery, Sensors and Calibration, Reports, Configuration, notification recipients, escalation policies, Users and Audit surfaces now expose Arabic copy.
- Report preview and export requests use the selected interface language rather than a fixed English value.
- SYSTEM_OWNER and P8 installation/acceptance localization remains preserved.

## Local verification

- Frontend TypeScript: passed.
- Frontend ESLint: passed.
- Frontend tests: 44 files / 276 tests passed.
- Added regression evidence for built-in Arabic navigation/resources and the Arabic customer calibration workflow with RTL.

## Integration evidence

- PR: #155.
- CI: run #543 / workflow run `33725884705` — passed.
- Source commit: `086218924494ae700807b3e414c2ea542f576f5d`.
- Merge: `e0f305c2286ff577f20df076b64118e327a5ba0c`.
- Release package readiness: `PASS (0.19.0)`; tag/GitHub Release publication remains a separate repository operation and is not claimed by this document.

## P8-01 live evidence

On the Windows installation, `npm run test:email-delivery` returned `SENT`, and the operator confirmed that the BIO-EMS Alarm message arrived in the recipient inbox. The repository contains no App Password, SMTP secret, or recipient address.

Meta for Developers continues to loop from registration to Email verification, so the following remain open:

1. Meta developer registration;
2. Phone Number ID and controlled permanent token;
3. approved BIO-EMS Alarm template;
4. confirmed live WhatsApp receipt;
5. one end-to-end Alarm through primary `WHATSAPP + EMAIL`;
6. Delivery Operations evidence review and final P8-01 closure.

## Next-session start point

1. Reconcile Windows `main` with the final GitHub merge from this package.
2. Do not repeat Email acceptance unless SMTP configuration changes.
3. Resume at the Meta developer-registration loop.
4. After Meta registration succeeds, complete the remaining WhatsApp and end-to-end evidence in the order above.
5. Do not claim physical installation, commissioning, customer UAT, or production acceptance without real evidence.
