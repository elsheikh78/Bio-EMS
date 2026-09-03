# P8-01A — Telegram Interim Alarm Delivery

**Date:** 3 September 2026  
**Status:** SOURCE IMPLEMENTED / LOCAL AUTOMATED GATES PASSED / LIVE BOT EVIDENCE OPEN

## Decision

Telegram is approved as an independent primary Alarm channel while Meta developer
registration blocks live WhatsApp setup. Telegram does not replace or masquerade as
the `WHATSAPP` channel. WhatsApp remains implemented and disabled until its real
credentials and approved template are available; both channels may be enabled later.

Recommended interim escalation step 1 is `TELEGRAM + EMAIL`. SMS remains a later
emergency/fallback step. After Meta acceptance, the primary step may use WhatsApp,
Telegram, Email, or an approved combination without changing Alarm generation.

## Implemented scope

- Added the explicit `TELEGRAM` channel across recipient endpoints, escalation steps,
  durable deliveries, Delivery Operations contracts, and bilingual configuration UI.
- Added a Telegram Bot API provider using the existing durable queue, retries,
  idempotency, append-only attempts, recipient eligibility, and escalation rules.
- Added migration 021 to preserve existing recipient, delivery, and attempt records
  while extending database channel constraints.
- Added secret-safe `BIOEMS_TELEGRAM_BOT_TOKEN` configuration and a controlled live
  smoke-test command.
- Telegram recipient addresses are numeric Chat IDs. Phone-number or username lookup
  is deliberately not inferred by the platform.

## Secret-safe configuration

Never commit the real values below.

```text
BIOEMS_NOTIFICATION_DELIVERY_ENABLED=true
BIOEMS_TELEGRAM_BOT_TOKEN=<BotFather token>
```

## Controlled live smoke test

The recipient must first open the bot and press **Start**. From `backend`, set the
test Chat ID temporarily in PowerShell and run:

```powershell
$env:BIOEMS_TELEGRAM_TEST_CHAT_ID = "<numeric chat id>"
try {
    npm run test:telegram-delivery
}
finally {
    Remove-Item Env:BIOEMS_TELEGRAM_TEST_CHAT_ID -ErrorAction SilentlyContinue
}
```

`SENT` proves that Telegram returned a message receipt. Arrival must still be
confirmed by the recipient and recorded without storing the token or Chat ID in Git.

## Evidence boundary and live closure

Automated tests prove configuration validation, request construction, response
parsing, database migration, frontend contracts, and regression safety. They do not
prove a real bot, a real Chat ID, field connectivity, end-to-end Alarm delivery, or
customer acceptance.

Live Telegram acceptance remains open until the operator creates the BIO-EMS bot,
presses Start from the controlled recipient account, obtains the numeric Chat ID,
runs the smoke test, confirms receipt, then executes one Alarm through
`TELEGRAM + EMAIL` and reviews Delivery Operations evidence.
