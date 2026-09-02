# P8-01 — WhatsApp and Email Alarm Delivery

**Date:** 2 September 2026
**Status:** IMPLEMENTED / MERGED / CI VERIFIED / LIVE PROVIDER EVIDENCE OPEN

## Integration evidence

- Provider implementation: PR #147 / CI run #526 / workflow `33597088923` / merge `17bbfc1d5623ad7bdf47d99e6d5954fc33a9666d`.
- Safe provider template and SMTP smoke test: PR #148 / CI run #528 / workflow `33647109572` / merge `a045e933dcd6583f1e7e32e73562f0ab2b45dd4c`.
- Backend local gate: typecheck, build, lint, format check, and 101 test files / 742 tests passed.

## Approved delivery order

WhatsApp and Email are the primary Alarm channels. SMS remains the emergency/fallback channel. Configure escalation step 1 with `WHATSAPP` and `EMAIL`; configure a later step with `SMS` when fallback is required.

## Implemented providers

- Meta WhatsApp Cloud API using an approved template and E.164 recipient endpoints.
- Authenticated SMTP Email with a readable BIO-EMS Alarm subject/body.
- Existing generic HTTPS SMS provider remains supported.
- All channels use the existing durable delivery queue, retry/idempotency rules, append-only attempt evidence, recipient eligibility, and escalation policies.

## Environment configuration

Do not commit any real value below.

```text
BIOEMS_NOTIFICATION_DELIVERY_ENABLED=true
BIOEMS_WHATSAPP_PHONE_NUMBER_ID=<Meta phone number id>
BIOEMS_WHATSAPP_ACCESS_TOKEN=<secret>
BIOEMS_WHATSAPP_TEMPLATE_NAME=bioems_alarm_alert
BIOEMS_WHATSAPP_TEMPLATE_LANGUAGE=en_US
BIOEMS_WHATSAPP_GRAPH_VERSION=v23.0
BIOEMS_EMAIL_SMTP_HOST=<smtp host>
BIOEMS_EMAIL_SMTP_PORT=465
BIOEMS_EMAIL_SMTP_SECURE=true
BIOEMS_EMAIL_SMTP_USERNAME=<smtp user>
BIOEMS_EMAIL_SMTP_PASSWORD=<secret>
BIOEMS_EMAIL_FROM=BIO-EMS <alerts@example.com>
```

The approved WhatsApp body template has four text variables in this order: severity, Alarm type, trigger value, and occurrence timestamp.

## Evidence boundary

Automated tests prove request construction, provider receipt parsing, queue integration, retry behavior and secret-safe failures. They do not prove Meta template approval, live WhatsApp delivery, SMTP inbox delivery, carrier SMS delivery, field network availability, or customer acceptance. Those require controlled live-provider/UAT evidence.

## Controlled SMTP smoke test

After placing the real SMTP values only in ignored `backend/.env`, set a temporary
recipient in the PowerShell process and run the supported smoke test:

```powershell
$env:BIOEMS_EMAIL_TEST_RECIPIENT = "recipient@example.com"
try {
    npm run test:email-delivery
}
finally {
    Remove-Item Env:BIOEMS_EMAIL_TEST_RECIPIENT -ErrorAction SilentlyContinue
}
```

The command reports `SENT` only after the SMTP provider returns a message receipt.
Inbox arrival remains live-provider evidence and must be confirmed by the recipient.

## Live setup handoff

- A Gmail App Password has been created by the operator. Its value is not stored in Git and must remain only in ignored local `backend/.env`.
- The Windows local copy still requires reconciliation to merge `a045e93` before running the smoke test.
- SYSTEM_OWNER login previously returned `PLATFORM_AUTH_UNAVAILABLE`; local `BIOEMS_PLATFORM_JWT_SECRET` configuration and backend restart require confirmation before claiming successful owner login.
- Meta for Developers registration loops from `Complete Registration` back to email verification on both desktop and mobile. Therefore no Phone Number ID, permanent access token, approved template, live WhatsApp send, or delivery evidence is claimed.

## Live closure criteria

P8-01 live acceptance closes only after:

- Gmail SMTP smoke-test receipt and confirmed inbox arrival;
- Meta Phone Number ID, controlled permanent token and approved Alarm template;
- confirmed live WhatsApp receipt;
- one end-to-end Alarm delivered through the durable engine to primary `WHATSAPP + EMAIL` steps;
- Delivery Operations evidence review and documented result.

These live checks remain open and resume on the Windows local system. They do not block the separately approved P8-02 through P8-08 source implementation.
