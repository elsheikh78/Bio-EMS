# P8-01 — WhatsApp and Email Alarm Delivery

**Date:** 2 September 2026
**Status:** IMPLEMENTED / MERGED / CI VERIFIED / LIVE PROVIDER EVIDENCE OPEN

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
